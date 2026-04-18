-- Contacts table
create table contacts (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  company text,
  role text,
  contact_type text check (contact_type in ('ex-client','prospect','referral-partner','lapsed-pitch','network')),
  contact_owner text check (contact_owner in ('Nicole','Danny')),
  kit_cadence text check (kit_cadence in ('6-weeks','2-months','3-months','6-months')),
  last_contacted date,
  next_due_date date,
  kit_stage integer default 1 check (kit_stage between 1 and 4),
  linkedin_url text,
  email text,
  notes text,
  is_active boolean default true,
  tags text[],
  created_at timestamptz default now()
);

-- Interactions table
create table interactions (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references contacts(id) on delete cascade,
  date date not null default current_date,
  type text check (type in ('email-sent','email-received','call','meeting','linkedin','note')),
  summary text,
  outcome text check (outcome in ('no-response','positive','catch-up-booked','brief-mentioned','other')),
  logged_by text,
  email_content text,
  next_action text,
  created_at timestamptz default now()
);

-- Function to calculate next_due_date from last_contacted + cadence
create or replace function calculate_next_due(last_contact date, cadence text)
returns date as $$
begin
  return case cadence
    when '6-weeks' then last_contact + interval '42 days'
    when '2-months' then last_contact + interval '60 days'
    when '3-months' then last_contact + interval '90 days'
    when '6-months' then last_contact + interval '180 days'
    else last_contact + interval '60 days'
  end;
end;
$$ language plpgsql;

-- Trigger: auto-update next_due_date when last_contacted changes
create or replace function update_next_due_date()
returns trigger as $$
begin
  if NEW.last_contacted is not null and NEW.kit_cadence is not null then
    NEW.next_due_date := calculate_next_due(NEW.last_contacted, NEW.kit_cadence);
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger contacts_next_due_trigger
before insert or update on contacts
for each row execute function update_next_due_date();

-- Seed with realistic dummy data
insert into contacts (full_name, company, role, contact_type, contact_owner, kit_cadence, last_contacted, kit_stage, email, notes, tags, is_active) values
('Sarah Mitchell', 'Meridian Law', 'Chief Marketing Officer', 'ex-client', 'Danny', '3-months', current_date - 75, 2, 'sarah.mitchell@meridianlaw.com', 'Led the rebrand project 18 months ago. Very happy with the outcome. Mentioned they may need help with a new service line launch in Q3. Prefers email over calls.', array['legal','rebrand','warm'], true),
('James Okafor', 'Vertex Partners', 'Head of Brand', 'prospect', 'Nicole', '2-months', current_date - 45, 1, 'j.okafor@vertexpartners.com', 'Met at a Brand Week event. Interested in brand strategy for a new B2B product. Budget not confirmed yet. Very engaged on LinkedIn.', array['consulting','b2b','new-contact'], true),
('Priya Nair', 'Foundry Capital', 'Partner', 'referral-partner', 'Danny', '6-months', current_date - 200, 1, 'pnair@foundrycapital.com', 'Refers portfolio companies to us occasionally. Last referral was Golconda. Keep warm but no pressure.', array['vc','referral'], true),
('Tom Wakefield', 'Clearpath Group', 'CEO', 'lapsed-pitch', 'Nicole', '3-months', current_date - 95, 1, 'tom.w@clearpathgroup.co.uk', 'Pitched in October, lost to an incumbent agency. Tom was personally positive about our work. Said to stay in touch for future.', array['infrastructure','ceo','lapsed'], true),
('Rachel Eze', 'Bloom Retail', 'Director of Marketing', 'ex-client', 'Nicole', '2-months', current_date - 30, 3, 'rachel@bloomretail.com', 'Completed a verbal identity project last year. Has hinted at a possible brand refresh conversation — mentioned budget pressures but seemed interested.', array['retail','verbal-identity','warm'], true);

insert into interactions (contact_id, date, type, summary, outcome, logged_by) values
((select id from contacts where full_name = 'Sarah Mitchell'), current_date - 75, 'email-sent', 'Sent a note referencing our conversation about their new service line. Shared a link to our Kennedys case study as relevant context.', 'no-response', 'Danny'),
((select id from contacts where full_name = 'James Okafor'), current_date - 45, 'call', 'Had a 20-minute catch-up. He is building a business case internally for a brand project. Expects to have more clarity in Q2.', 'positive', 'Nicole'),
((select id from contacts where full_name = 'Rachel Eze'), current_date - 30, 'email-sent', 'Sent a note asking for feedback on our new positioning framework. She replied with useful thoughts and mentioned Q3 as a possible window.', 'catch-up-booked', 'Nicole');
