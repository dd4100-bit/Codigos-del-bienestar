-- Run this in Supabase SQL Editor to add the response column
alter table conversations add column if not exists response text;
