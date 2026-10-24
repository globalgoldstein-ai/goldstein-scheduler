-- Goldstein Scheduler | Phase 9 | Session 3 | Build 2 | 2026-10-24 14:05 ET | seed: DCPS SY26-27 and UMN 2026-27 no-school dates
--
-- WHERE TO RUN: Supabase dashboard > SQL Editor. Safe to re-run (skips rows that already exist).
-- UNDO:         delete from events where notes like 'SEED %';
--
-- Sources:
--   DCPS SY 2026-27 calendar (English flip calendar PDF), dcps.dc.gov
--   UMN Twin Cities 2026-27 term dates (asr.umn.edu) and university holidays (hr.umn.edu)
--
-- Categories: 'holiday' = breaks and days families usually swap around; 'school' = no-school days (shown as "No school").
-- UMN Thanksgiving break (Nov 23-27) and spring break (Mar 8-12) come from the UMN One Stop calendar text supplied by Aaron.
-- Not included: DCPS 2027-06-21 (after the last day of school).
-- Check before relying on: DCPS lists 2026-11-02 and 2027-04-09 as half-day records/wellness in its sidebar but no school for students in the monthly pages.

insert into events (title, kid, category, date_start, date_end, status, notes)
select v.title, v.kid, v.category, v.date_start::date, v.date_end::date, 'agreed', v.notes
from (values
  -- DCPS (Zoe): holidays and breaks
  ('Labor Day',                 'zoe',  'holiday', '2026-09-07', '2026-09-07', 'SEED DCPS SY26-27'),
  ('Indigenous Peoples'' Day',  'zoe',  'holiday', '2026-10-12', '2026-10-12', 'SEED DCPS SY26-27'),
  ('Veterans Day',              'zoe',  'holiday', '2026-11-11', '2026-11-11', 'SEED DCPS SY26-27'),
  ('Thanksgiving Break',        'zoe',  'holiday', '2026-11-25', '2026-11-27', 'SEED DCPS SY26-27'),
  ('Winter Break',              'zoe',  'holiday', '2026-12-22', '2026-12-31', 'SEED DCPS SY26-27'),
  ('New Year''s Day',           'zoe',  'holiday', '2027-01-01', '2027-01-01', 'SEED DCPS SY26-27'),
  ('MLK Day',                   'zoe',  'holiday', '2027-01-18', '2027-01-18', 'SEED DCPS SY26-27'),
  ('Presidents Day',            'zoe',  'holiday', '2027-02-15', '2027-02-15', 'SEED DCPS SY26-27'),
  ('Spring Break',              'zoe',  'holiday', '2027-03-22', '2027-03-26', 'SEED DCPS SY26-27'),
  ('DC Emancipation Day',       'zoe',  'holiday', '2027-04-16', '2027-04-16', 'SEED DCPS SY26-27'),
  ('Memorial Day',              'zoe',  'holiday', '2027-05-31', '2027-05-31', 'SEED DCPS SY26-27'),
  ('Juneteenth (observed)',     'zoe',  'holiday', '2027-06-18', '2027-06-18', 'SEED DCPS SY26-27'),
  -- DCPS (Zoe): no-school days
  ('Parent-teacher conference day', 'zoe', 'school', '2026-10-13', '2026-10-13', 'SEED DCPS SY26-27'),
  ('Staff PD day',              'zoe',  'school',  '2026-10-30', '2026-10-30', 'SEED DCPS SY26-27'),
  ('Records / wellness day',    'zoe',  'school',  '2026-11-02', '2026-11-02', 'SEED DCPS SY26-27'),
  ('Election Day',              'zoe',  'school',  '2026-11-03', '2026-11-03', 'SEED DCPS SY26-27'),
  ('Staff PD day',              'zoe',  'school',  '2026-12-21', '2026-12-21', 'SEED DCPS SY26-27'),
  ('Staff PD / records day',    'zoe',  'school',  '2027-01-26', '2027-01-26', 'SEED DCPS SY26-27'),
  ('Parent-teacher conference day', 'zoe', 'school', '2027-02-11', '2027-02-11', 'SEED DCPS SY26-27'),
  ('Staff PD day',              'zoe',  'school',  '2027-02-12', '2027-02-12', 'SEED DCPS SY26-27'),
  ('Records / wellness day',    'zoe',  'school',  '2027-04-09', '2027-04-09', 'SEED DCPS SY26-27'),
  ('Wellness day',              'zoe',  'school',  '2027-05-14', '2027-05-14', 'SEED DCPS SY26-27'),
  -- UMN Twin Cities (Noah): no classes
  ('UMN Labor Day',             'noah', 'school',  '2026-09-07', '2026-09-07', 'SEED UMN 2026-27'),
  ('UMN Thanksgiving',          'noah', 'school',  '2026-11-23', '2026-11-27', 'SEED UMN 2026-27'),
  ('UMN winter break',          'noah', 'school',  '2026-12-24', '2027-01-18', 'SEED UMN 2026-27'),
  ('UMN spring break',          'noah', 'school',  '2027-03-08', '2027-03-12', 'SEED UMN 2026-27')
) as v(title, kid, category, date_start, date_end, notes)
where not exists (
  select 1 from events e
  where e.title = v.title and e.kid = v.kid and e.date_start = v.date_start::date
);
