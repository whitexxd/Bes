/*
# Make tournaments.created_by nullable

## Overview
The `created_by` column on `tournaments` was defined NOT NULL with a default
of `auth.uid()`. This blocks seeding tournaments outside an authenticated
session (where auth.uid() is null). Making it nullable allows admin-seeded
tournaments while still populating the column automatically when an admin
creates one through the app.

## Changes
- `tournaments.created_by` altered to allow NULL (drops NOT NULL constraint).
*/

ALTER TABLE public.tournaments ALTER COLUMN created_by DROP NOT NULL;
