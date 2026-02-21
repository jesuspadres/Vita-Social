-- =============================================================================
-- Vita Social -- Initial Database Schema
-- Migration: 001_initial_schema.sql
-- =============================================================================
-- This migration creates the complete database schema for the Vita dating/social
-- platform including profiles, swiping, matching, messaging, groups, events,
-- GPS check-ins, notifications, reports, and blocks.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists "postgis"  with schema public;
create extension if not exists "pg_cron"  with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ---------------------------------------------------------------------------
-- Custom Enum Types
-- ---------------------------------------------------------------------------

create type public.verification_level as enum ('none', 'green', 'blue', 'gold');
create type public.swipe_action        as enum ('like', 'pass', 'super_like');
create type public.message_type        as enum ('text', 'image', 'icebreaker', 'system');
create type public.group_privacy       as enum ('open', 'closed', 'secret');
create type public.group_role          as enum ('admin', 'moderator', 'member');
create type public.event_visibility    as enum ('public', 'group', 'friends');
create type public.rsvp_status         as enum ('going', 'maybe', 'declined');
create type public.report_content_type as enum ('user', 'message', 'group_post', 'event');
create type public.report_status       as enum ('pending', 'reviewed', 'resolved', 'dismissed');
create type public.notification_type   as enum (
  'match',
  'message',
  'event_reminder',
  'group_invite',
  'health_warning',
  'checkin_reminder'
);

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  first_name         text not null,
  last_name          text,
  bio                text,
  gender             text,
  birthday           date,
  avatar_url         text,
  photos             text[] default '{}',
  interests          text[] default '{}',
  location           geography(point, 4326),
  location_name      text,
  verification_level public.verification_level not null default 'none',
  is_online          boolean not null default false,
  last_seen          timestamptz default now(),
  gold_subscriber    boolean not null default false,
  gold_expires_at    timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.profiles is 'User profiles extending Supabase auth.users.';

create index idx_profiles_location      on public.profiles using gist (location);
create index idx_profiles_is_online     on public.profiles (is_online);
create index idx_profiles_last_seen     on public.profiles (last_seen desc);
create index idx_profiles_gold          on public.profiles (gold_subscriber) where gold_subscriber = true;
create index idx_profiles_verification  on public.profiles (verification_level);

-- ---------------------------------------------------------------------------
-- 2. swipe_actions
-- ---------------------------------------------------------------------------

create table public.swipe_actions (
  id         uuid primary key default gen_random_uuid(),
  swiper_id  uuid not null references public.profiles (id) on delete cascade,
  swiped_id  uuid not null references public.profiles (id) on delete cascade,
  action     public.swipe_action not null,
  created_at timestamptz not null default now(),

  constraint uq_swipe_pair unique (swiper_id, swiped_id),
  constraint chk_no_self_swipe check (swiper_id <> swiped_id)
);

comment on table public.swipe_actions is 'Records each like / pass / super_like action.';

create index idx_swipe_actions_swiped   on public.swipe_actions (swiped_id);
create index idx_swipe_actions_action   on public.swipe_actions (action) where action in ('like', 'super_like');
create index idx_swipe_actions_created  on public.swipe_actions (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. matches
-- ---------------------------------------------------------------------------

create table public.matches (
  id         uuid primary key default gen_random_uuid(),
  user1_id   uuid not null references public.profiles (id) on delete cascade,
  user2_id   uuid not null references public.profiles (id) on delete cascade,
  matched_at timestamptz not null default now(),
  is_active  boolean not null default true,

  constraint uq_match_pair unique (user1_id, user2_id),
  constraint chk_match_order check (user1_id < user2_id) -- canonical ordering prevents duplicates
);

comment on table public.matches is 'Mutual-like matches between two users.';

create index idx_matches_user1    on public.matches (user1_id) where is_active = true;
create index idx_matches_user2    on public.matches (user2_id) where is_active = true;
create index idx_matches_active   on public.matches (is_active);
create index idx_matches_date     on public.matches (matched_at desc);

-- ---------------------------------------------------------------------------
-- 4. conversations
-- ---------------------------------------------------------------------------

create table public.conversations (
  id                uuid primary key default gen_random_uuid(),
  match_id          uuid not null unique references public.matches (id) on delete cascade,
  last_message_text text,
  last_message_at   timestamptz,
  created_at        timestamptz not null default now()
);

comment on table public.conversations is 'Chat threads -- one per match.';

create index idx_conversations_match      on public.conversations (match_id);
create index idx_conversations_last_msg   on public.conversations (last_message_at desc nulls last);

-- ---------------------------------------------------------------------------
-- 5. messages
-- ---------------------------------------------------------------------------

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  content         text not null,
  message_type    public.message_type not null default 'text',
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.messages is 'Individual messages within a conversation.';

create index idx_messages_conversation  on public.messages (conversation_id, created_at desc);
create index idx_messages_sender        on public.messages (sender_id);
create index idx_messages_unread        on public.messages (conversation_id, read_at) where read_at is null;

-- ---------------------------------------------------------------------------
-- 6. groups
-- ---------------------------------------------------------------------------

create table public.groups (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  category        text,
  cover_image_url text,
  creator_id      uuid not null references public.profiles (id) on delete cascade,
  privacy         public.group_privacy not null default 'open',
  max_members     int not null default 50,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.groups is 'Community groups with health-ring mechanics.';

create index idx_groups_creator   on public.groups (creator_id);
create index idx_groups_privacy   on public.groups (privacy);
create index idx_groups_category  on public.groups (category);
create index idx_groups_created   on public.groups (created_at desc);

-- ---------------------------------------------------------------------------
-- 7. group_members
-- ---------------------------------------------------------------------------

create table public.group_members (
  id                      uuid primary key default gen_random_uuid(),
  group_id                uuid not null references public.groups (id) on delete cascade,
  user_id                 uuid not null references public.profiles (id) on delete cascade,
  role                    public.group_role not null default 'member',
  days_since_last_checkin int not null default 0,
  last_checkin_at         timestamptz,
  joined_at               timestamptz not null default now(),

  constraint uq_group_member unique (group_id, user_id)
);

comment on table public.group_members is 'Group membership with health-ring tracking.';

create index idx_group_members_user      on public.group_members (user_id);
create index idx_group_members_group     on public.group_members (group_id);
create index idx_group_members_health    on public.group_members (days_since_last_checkin desc);
create index idx_group_members_role      on public.group_members (group_id, role);

-- ---------------------------------------------------------------------------
-- 8. group_posts
-- ---------------------------------------------------------------------------

create table public.group_posts (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.groups (id) on delete cascade,
  author_id      uuid not null references public.profiles (id) on delete cascade,
  content        text not null,
  image_url      text,
  likes_count    int not null default 0,
  comments_count int not null default 0,
  created_at     timestamptz not null default now()
);

comment on table public.group_posts is 'Feed posts within a group.';

create index idx_group_posts_group    on public.group_posts (group_id, created_at desc);
create index idx_group_posts_author   on public.group_posts (author_id);
create index idx_group_posts_created  on public.group_posts (created_at desc);

-- ---------------------------------------------------------------------------
-- 9. events
-- ---------------------------------------------------------------------------

create table public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  host_id          uuid not null references public.profiles (id) on delete cascade,
  group_id         uuid references public.groups (id) on delete set null,
  location         geography(point, 4326) not null,
  location_name    text not null,
  location_address text,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  visibility       public.event_visibility not null default 'public',
  max_attendees    int,
  is_residential   boolean not null default false,
  cover_image_url  text,
  created_at       timestamptz not null default now(),

  constraint chk_event_dates check (ends_at > starts_at)
);

comment on table public.events is 'Location-based events with optional group association.';

create index idx_events_host       on public.events (host_id);
create index idx_events_group      on public.events (group_id) where group_id is not null;
create index idx_events_location   on public.events using gist (location);
create index idx_events_starts     on public.events (starts_at);
create index idx_events_visibility on public.events (visibility);
create index idx_events_created    on public.events (created_at desc);

-- ---------------------------------------------------------------------------
-- 10. event_attendees
-- ---------------------------------------------------------------------------

create table public.event_attendees (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  status        public.rsvp_status not null default 'going',
  checked_in    boolean not null default false,
  checked_in_at timestamptz,

  constraint uq_event_attendee unique (event_id, user_id)
);

comment on table public.event_attendees is 'RSVP records for events.';

create index idx_event_attendees_event   on public.event_attendees (event_id);
create index idx_event_attendees_user    on public.event_attendees (user_id);
create index idx_event_attendees_status  on public.event_attendees (event_id, status);

-- ---------------------------------------------------------------------------
-- 11. event_checkins
-- ---------------------------------------------------------------------------

create table public.event_checkins (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references public.events (id) on delete cascade,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  location            geography(point, 4326) not null,
  distance_from_event double precision not null, -- meters
  is_valid            boolean not null default false,
  created_at          timestamptz not null default now()
);

comment on table public.event_checkins is 'GPS-verified check-in attempts at events.';

create index idx_event_checkins_event   on public.event_checkins (event_id);
create index idx_event_checkins_user    on public.event_checkins (user_id);
create index idx_event_checkins_valid   on public.event_checkins (event_id, is_valid) where is_valid = true;
create index idx_event_checkins_created on public.event_checkins (created_at desc);

-- ---------------------------------------------------------------------------
-- 12. reports
-- ---------------------------------------------------------------------------

create table public.reports (
  id                    uuid primary key default gen_random_uuid(),
  reporter_id           uuid not null references public.profiles (id) on delete cascade,
  reported_user_id      uuid references public.profiles (id) on delete set null,
  reported_content_type public.report_content_type not null,
  reported_content_id   uuid not null,
  reason                text not null,
  description           text,
  status                public.report_status not null default 'pending',
  created_at            timestamptz not null default now()
);

comment on table public.reports is 'User- and content-level moderation reports.';

create index idx_reports_reporter   on public.reports (reporter_id);
create index idx_reports_reported   on public.reports (reported_user_id) where reported_user_id is not null;
create index idx_reports_status     on public.reports (status);
create index idx_reports_content    on public.reports (reported_content_type, reported_content_id);
create index idx_reports_created    on public.reports (created_at desc);

-- ---------------------------------------------------------------------------
-- 13. blocks
-- ---------------------------------------------------------------------------

create table public.blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint uq_block_pair unique (blocker_id, blocked_id),
  constraint chk_no_self_block check (blocker_id <> blocked_id)
);

comment on table public.blocks is 'User-to-user blocks.';

create index idx_blocks_blocker on public.blocks (blocker_id);
create index idx_blocks_blocked on public.blocks (blocked_id);

-- ---------------------------------------------------------------------------
-- 14. notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null,
  title      text not null,
  body       text,
  data       jsonb default '{}',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.notifications is 'In-app notifications for users.';

create index idx_notifications_user     on public.notifications (user_id, created_at desc);
create index idx_notifications_unread   on public.notifications (user_id, read) where read = false;
create index idx_notifications_type     on public.notifications (type);
create index idx_notifications_created  on public.notifications (created_at desc);

-- ===========================================================================
-- Functions & Triggers
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- updated_at auto-touch
-- ---------------------------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger trg_groups_updated_at
  before update on public.groups
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on auth.users insert
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', '')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Check for mutual likes and create a match + conversation
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_swipe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other_action public.swipe_action;
  v_match_id     uuid;
  v_user1        uuid;
  v_user2        uuid;
begin
  -- Only process likes and super-likes
  if new.action = 'pass' then
    return new;
  end if;

  -- Check if the other person already liked or super-liked us
  select action into v_other_action
  from public.swipe_actions
  where swiper_id = new.swiped_id
    and swiped_id = new.swiper_id
    and action in ('like', 'super_like');

  -- If mutual like found, create a match
  if v_other_action is not null then
    -- Canonical ordering: smaller UUID first
    if new.swiper_id < new.swiped_id then
      v_user1 := new.swiper_id;
      v_user2 := new.swiped_id;
    else
      v_user1 := new.swiped_id;
      v_user2 := new.swiper_id;
    end if;

    -- Insert match (ignore if somehow exists)
    insert into public.matches (user1_id, user2_id)
    values (v_user1, v_user2)
    on conflict (user1_id, user2_id) do nothing
    returning id into v_match_id;

    -- If match was newly created, create conversation and notifications
    if v_match_id is not null then
      -- Create conversation
      insert into public.conversations (match_id)
      values (v_match_id);

      -- Notify both users
      insert into public.notifications (user_id, type, title, body, data)
      values
        (new.swiper_id, 'match', 'New Match!', 'You have a new match. Start a conversation!',
         jsonb_build_object('match_id', v_match_id, 'matched_user_id', new.swiped_id)),
        (new.swiped_id, 'match', 'New Match!', 'You have a new match. Start a conversation!',
         jsonb_build_object('match_id', v_match_id, 'matched_user_id', new.swiper_id));
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_on_swipe_check_match
  after insert on public.swipe_actions
  for each row execute function public.handle_new_swipe();

-- ---------------------------------------------------------------------------
-- Update conversation preview on new message
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_text = new.content,
      last_message_at   = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_on_message_update_conversation
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- ---------------------------------------------------------------------------
-- Health ring decay -- increment days_since_last_checkin for all group members
-- ---------------------------------------------------------------------------

create or replace function public.increment_days_since_last_checkin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.group_members
  set days_since_last_checkin = days_since_last_checkin + 1;
end;
$$;

-- Schedule the cron job: runs daily at midnight UTC
select cron.schedule(
  'health-ring-decay',
  '0 0 * * *',
  $$ select public.increment_days_since_last_checkin(); $$
);

-- ===========================================================================
-- Row Level Security (RLS)
-- ===========================================================================

-- Enable RLS on ALL tables
alter table public.profiles         enable row level security;
alter table public.swipe_actions    enable row level security;
alter table public.matches          enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;
alter table public.groups           enable row level security;
alter table public.group_members    enable row level security;
alter table public.group_posts      enable row level security;
alter table public.events           enable row level security;
alter table public.event_attendees  enable row level security;
alter table public.event_checkins   enable row level security;
alter table public.reports          enable row level security;
alter table public.blocks           enable row level security;
alter table public.notifications    enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: check if user is blocked
-- ---------------------------------------------------------------------------

create or replace function public.is_blocked(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = user_a and blocked_id = user_b)
       or (blocker_id = user_b and blocked_id = user_a)
  );
$$;

-- ---------------------------------------------------------------------------
-- Helper: check if user is a participant in a conversation
-- ---------------------------------------------------------------------------

create or replace function public.is_conversation_participant(p_user_id uuid, p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    join public.matches m on m.id = c.match_id
    where c.id = p_conversation_id
      and (m.user1_id = p_user_id or m.user2_id = p_user_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------

create policy "profiles_select_own"
  on public.profiles for select
  using (true); -- all authenticated users can view profiles

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- swipe_actions policies
-- ---------------------------------------------------------------------------

create policy "swipes_insert_own"
  on public.swipe_actions for insert
  with check (auth.uid() = swiper_id);

create policy "swipes_select_own"
  on public.swipe_actions for select
  using (auth.uid() = swiper_id or auth.uid() = swiped_id);

-- ---------------------------------------------------------------------------
-- matches policies
-- ---------------------------------------------------------------------------

create policy "matches_select_own"
  on public.matches for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "matches_update_own"
  on public.matches for update
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- ---------------------------------------------------------------------------
-- conversations policies
-- ---------------------------------------------------------------------------

create policy "conversations_select_own"
  on public.conversations for select
  using (
    public.is_conversation_participant(auth.uid(), id)
  );

create policy "conversations_update_own"
  on public.conversations for update
  using (
    public.is_conversation_participant(auth.uid(), id)
  );

-- ---------------------------------------------------------------------------
-- messages policies
-- ---------------------------------------------------------------------------

create policy "messages_select_own"
  on public.messages for select
  using (
    public.is_conversation_participant(auth.uid(), conversation_id)
  );

create policy "messages_insert_own"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_conversation_participant(auth.uid(), conversation_id)
  );

create policy "messages_update_read"
  on public.messages for update
  using (
    -- Only the recipient (not sender) can mark as read
    auth.uid() <> sender_id
    and public.is_conversation_participant(auth.uid(), conversation_id)
  );

-- ---------------------------------------------------------------------------
-- groups policies
-- ---------------------------------------------------------------------------

create policy "groups_select_visible"
  on public.groups for select
  using (
    privacy in ('open', 'closed')
    or creator_id = auth.uid()
    or exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid()
    )
  );

create policy "groups_insert_own"
  on public.groups for insert
  with check (auth.uid() = creator_id);

create policy "groups_update_admin"
  on public.groups for update
  using (
    creator_id = auth.uid()
    or exists (
      select 1 from public.group_members
      where group_id = groups.id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "groups_delete_owner"
  on public.groups for delete
  using (creator_id = auth.uid());

-- ---------------------------------------------------------------------------
-- group_members policies
-- ---------------------------------------------------------------------------

create policy "group_members_select"
  on public.group_members for select
  using (
    -- Members can see other members of their groups
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
    )
    -- Or the group is open/closed (public listing)
    or exists (
      select 1 from public.groups g
      where g.id = group_members.group_id
        and g.privacy in ('open', 'closed')
    )
  );

create policy "group_members_insert"
  on public.group_members for insert
  with check (
    auth.uid() = user_id
    -- Can self-join open groups
    and exists (
      select 1 from public.groups g
      where g.id = group_id and g.privacy = 'open'
    )
    -- Or an admin is adding them (handled by service role)
  );

create policy "group_members_update_admin"
  on public.group_members for update
  using (
    -- Admins/moderators can update roles
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('admin', 'moderator')
    )
    -- Or updating own record (e.g., checkin fields)
    or user_id = auth.uid()
  );

create policy "group_members_delete"
  on public.group_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- group_posts policies
-- ---------------------------------------------------------------------------

create policy "group_posts_select"
  on public.group_posts for select
  using (
    exists (
      select 1 from public.group_members
      where group_id = group_posts.group_id
        and user_id = auth.uid()
    )
  );

create policy "group_posts_insert"
  on public.group_posts for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.group_members
      where group_id = group_posts.group_id
        and user_id = auth.uid()
    )
  );

create policy "group_posts_update_own"
  on public.group_posts for update
  using (auth.uid() = author_id);

create policy "group_posts_delete"
  on public.group_posts for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.group_members
      where group_id = group_posts.group_id
        and user_id = auth.uid()
        and role in ('admin', 'moderator')
    )
  );

-- ---------------------------------------------------------------------------
-- events policies
-- ---------------------------------------------------------------------------

create policy "events_select_visible"
  on public.events for select
  using (
    visibility = 'public'
    or host_id = auth.uid()
    -- Group events visible to group members
    or (
      visibility = 'group'
      and group_id is not null
      and exists (
        select 1 from public.group_members
        where group_id = events.group_id
          and user_id = auth.uid()
      )
    )
    -- Friends events visible to matched users
    or (
      visibility = 'friends'
      and exists (
        select 1 from public.matches
        where is_active = true
          and (
            (user1_id = auth.uid() and user2_id = events.host_id)
            or (user2_id = auth.uid() and user1_id = events.host_id)
          )
      )
    )
    -- Attendees can always see
    or exists (
      select 1 from public.event_attendees
      where event_id = events.id
        and user_id = auth.uid()
    )
  );

create policy "events_insert_own"
  on public.events for insert
  with check (auth.uid() = host_id);

create policy "events_update_own"
  on public.events for update
  using (auth.uid() = host_id);

create policy "events_delete_own"
  on public.events for delete
  using (auth.uid() = host_id);

-- ---------------------------------------------------------------------------
-- event_attendees policies
-- ---------------------------------------------------------------------------

create policy "event_attendees_select"
  on public.event_attendees for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.event_attendees ea
      where ea.event_id = event_attendees.event_id
        and ea.user_id = auth.uid()
    )
    -- Event host can see all attendees
    or exists (
      select 1 from public.events e
      where e.id = event_attendees.event_id
        and e.host_id = auth.uid()
    )
  );

create policy "event_attendees_insert_own"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

create policy "event_attendees_update_own"
  on public.event_attendees for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.events e
      where e.id = event_attendees.event_id
        and e.host_id = auth.uid()
    )
  );

create policy "event_attendees_delete_own"
  on public.event_attendees for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- event_checkins policies
-- ---------------------------------------------------------------------------

create policy "event_checkins_select"
  on public.event_checkins for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.events e
      where e.id = event_checkins.event_id
        and e.host_id = auth.uid()
    )
  );

create policy "event_checkins_insert_own"
  on public.event_checkins for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- reports policies
-- ---------------------------------------------------------------------------

create policy "reports_insert_own"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "reports_select_own"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- Note: admin review of reports is handled via service_role, not RLS

-- ---------------------------------------------------------------------------
-- blocks policies
-- ---------------------------------------------------------------------------

create policy "blocks_select_own"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "blocks_insert_own"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "blocks_delete_own"
  on public.blocks for delete
  using (auth.uid() = blocker_id);

-- ---------------------------------------------------------------------------
-- notifications policies
-- ---------------------------------------------------------------------------

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ===========================================================================
-- Grants (allow authenticated users to interact via RLS)
-- ===========================================================================

grant usage on schema public to anon, authenticated;

grant select                           on public.profiles         to anon, authenticated;
grant insert, update, delete           on public.profiles         to authenticated;

grant select, insert                   on public.swipe_actions    to authenticated;

grant select, update                   on public.matches          to authenticated;

grant select, update                   on public.conversations    to authenticated;

grant select, insert, update           on public.messages         to authenticated;

grant select, insert, update, delete   on public.groups           to authenticated;

grant select, insert, update, delete   on public.group_members    to authenticated;

grant select, insert, update, delete   on public.group_posts      to authenticated;

grant select, insert, update, delete   on public.events           to authenticated;

grant select, insert, update, delete   on public.event_attendees  to authenticated;

grant select, insert                   on public.event_checkins   to authenticated;

grant select, insert                   on public.reports          to authenticated;

grant select, insert, delete           on public.blocks           to authenticated;

grant select, update, delete           on public.notifications    to authenticated;
