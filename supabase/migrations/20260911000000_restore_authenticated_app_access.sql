-- Restore the table privileges required by the authenticated application.
-- Row-level security remains the source of truth for which rows each user may access.

begin;

grant usage on schema public to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.parts to authenticated;
grant select, insert, update, delete on public.inquiries to authenticated;
grant select, insert, update, delete on public.content_posts to authenticated;
grant select, insert, update on public.dealer_settings to authenticated;
grant select, insert, update, delete on public.car_models to authenticated;
grant select, insert, update, delete on public.news_articles to authenticated;
grant select, insert, delete on public.forum_threads to authenticated;
grant select, insert on public.forum_replies to authenticated;

drop policy if exists "Only admins can insert dealer settings" on public.dealer_settings;
create policy "Only admins can insert dealer settings"
  on public.dealer_settings
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Customers can delete own inquiries" on public.inquiries;
create policy "Customers can delete own inquiries"
  on public.inquiries
  for delete
  to authenticated
  using (customer_id = auth.uid());

-- Keep forum reply totals accurate without granting customers broad thread edits.
create or replace function public.sync_forum_reply_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_thread_id uuid;
begin
  if tg_op = 'DELETE' then
    affected_thread_id := old.thread_id;
  else
    affected_thread_id := new.thread_id;
  end if;

  update public.forum_threads
  set replies_count = (
    select count(*)::integer
    from public.forum_replies
    where thread_id = affected_thread_id
  )
  where id = affected_thread_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_forum_reply_count() from public, anon, authenticated;

drop trigger if exists sync_forum_reply_count_after_change on public.forum_replies;
create trigger sync_forum_reply_count_after_change
  after insert or delete on public.forum_replies
  for each row execute function public.sync_forum_reply_count();

commit;
