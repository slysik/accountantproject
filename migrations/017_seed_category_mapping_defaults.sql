WITH default_mappings(source_label, category_id) AS (
  VALUES
    ('Advertising', 'advertising'),
    ('Ads & Marketing', 'advertising'),
    ('Marketing', 'advertising'),
    ('Digital Advertising', 'advertising'),
    ('Social Media Ads', 'advertising'),
    ('Google Ads', 'advertising'),
    ('Facebook Ads', 'advertising'),
    ('SEO / SEM', 'advertising'),
    ('Promotions', 'advertising'),
    ('Software', 'software_subscriptions'),
    ('Software & Apps', 'software_subscriptions'),
    ('Subscriptions', 'software_subscriptions'),
    ('SaaS', 'software_subscriptions'),
    ('Cloud Services', 'software_subscriptions'),
    ('Web Hosting', 'software_subscriptions'),
    ('Domain Registration', 'software_subscriptions'),
    ('Productivity Tools', 'software_subscriptions'),
    ('Meals', 'meals'),
    ('Business Meals', 'meals'),
    ('Dining', 'meals'),
    ('Coffee Meetings', 'meals'),
    ('Travel', 'travel'),
    ('Airfare', 'travel'),
    ('Hotels', 'travel'),
    ('Lodging', 'travel'),
    ('Auto', 'car_truck'),
    ('Fuel', 'car_truck'),
    ('Parking & Tolls', 'car_truck'),
    ('Mileage', 'car_truck'),
    ('Ride Share', 'car_truck'),
    ('Office Supplies', 'office_expense'),
    ('Office Equipment', 'office_expense'),
    ('Printing & Copying', 'office_expense'),
    ('Materials', 'supplies'),
    ('Job Supplies', 'supplies'),
    ('General Supplies', 'supplies'),
    ('Internet', 'utilities'),
    ('Phone', 'utilities'),
    ('Utilities', 'utilities'),
    ('Cell Phone', 'utilities'),
    ('Accounting', 'legal_professional'),
    ('Legal', 'legal_professional'),
    ('Professional Fees', 'legal_professional'),
    ('Consulting', 'legal_professional'),
    ('Merchant Fees', 'commissions_fees'),
    ('Processing Fees', 'commissions_fees'),
    ('Platform Fees', 'commissions_fees'),
    ('Contractors', 'contract_labor'),
    ('Freelancers', 'contract_labor'),
    ('Contract Labor', 'contract_labor')
),
matched_expense_labels AS (
  SELECT DISTINCT
    e.user_id,
    trim(e.original_category) AS source_label,
    dm.category_id
  FROM expenses e
  JOIN default_mappings dm
    ON lower(trim(e.original_category)) = lower(dm.source_label)
  WHERE coalesce(trim(e.original_category), '') <> ''
)
INSERT INTO category_mappings (user_id, source_label, category_id)
SELECT
  mel.user_id,
  mel.source_label,
  mel.category_id
FROM matched_expense_labels mel
ON CONFLICT (user_id, source_label)
DO UPDATE SET
  category_id = EXCLUDED.category_id,
  updated_at = now();
