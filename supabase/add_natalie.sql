-- Add Natalie as a test contact
insert into contacts (full_name, company, role, contact_type, contact_owner, kit_cadence, last_contacted, kit_stage, email, notes, tags, is_active)
values (
  'Natalie Ashworth',
  'Fieldwork Studio',
  'Head of Marketing',
  'prospect',
  'Nicole',
  '2-months',
  current_date - 20,
  2,
  'natalie@huddlecreative.com',
  'Met through a mutual contact at a design event. Expressed interest in brand strategy work for a new product line they are developing. Warm and engaged — worth nurturing.',
  array['prospect','design','warm'],
  true
);
