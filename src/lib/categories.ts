import type { IrsCategory } from '@/types';

// IRS Business Expense Categories
// Based on Schedule C (Form 1040) and IRS Publication 535

export const IRS_EXPENSE_CATEGORIES: Record<string, IrsCategory> = {
  advertising: {
    name: "Advertising",
    description: "Business promotion costs",
    keywords: ["facebook ads", "google ads", "advertising", "marketing", "promotion", "billboard", "radio ad", "tv ad", "social media", "ad campaign", "sponsor", "adwords", "meta ads", "linkedin ads", "yelp ads", "instagram ads", "twitter ads", "pinterest ads", "snapchat ads", "tiktok ads", "bing ads", "criteo", "taboola", "outbrain", "marketing agency", "seo services", "sem services", "content marketing", "email marketing", "mailchimp", "constant contact", "hubspot", "activecampaign"]
  },
  car_truck: {
    name: "Car and Truck Expenses",
    description: "Vehicle expenses for business use",
    keywords: ["gas", "fuel", "gasoline", "diesel", "car wash", "parking", "parking lot", "toll", "auto repair", "car repair", "vehicle maintenance", "oil change", "tire", "uber", "lyft", "taxi", "car rental", "hertz", "enterprise", "avis", "mileage", "ev charging", "supercharger", "shell", "chevron", "exxon", "mobil", "bp", "sunoco", "valero", "texaco", "jiffy lube", "pep boys", "firestone", "goodyear", "ez pass", "fastrak"]
  },
  commissions_fees: {
    name: "Commissions and Fees",
    description: "Fees paid to contractors or services",
    keywords: ["commission", "referral fee", "finder fee", "broker fee", "agent fee", "stripe fee", "paypal fee", "square fee", "merchant fee", "processing fee", "transaction fee", "shopify fees", "etsy fees", "amazon seller fees", "ebay fees", "upwork fees", "fiverr fees", "toptal fees"]
  },
  contract_labor: {
    name: "Contract Labor",
    description: "Payments to independent contractors",
    keywords: ["contractor", "freelancer", "consultant", "fiverr", "upwork", "toptal", "99designs", "contract work", "subcontractor", "1099", "gig worker", "independent contractor"]
  },
  depletion: {
    name: "Depletion",
    description: "Natural resource depletion",
    keywords: ["depletion", "mineral rights", "oil rights", "gas rights", "timber"]
  },
  depreciation: {
    name: "Depreciation",
    description: "Depreciation of business assets",
    keywords: ["depreciation", "amortization", "asset writeoff"]
  },
  employee_benefits: {
    name: "Employee Benefit Programs",
    description: "Health insurance, retirement plans, etc.",
    keywords: ["health insurance", "dental insurance", "vision insurance", "401k", "retirement", "pension", "hsa", "fsa", "life insurance", "disability insurance", "benefits", "cobra", "metlife", "aetna", "cigna", "blue cross", "blue shield", "unitedhealth", "humana", "principal", "vanguard", "fidelity"]
  },
  insurance: {
    name: "Insurance (other than health)",
    description: "Business insurance premiums",
    keywords: ["liability insurance", "business insurance", "professional insurance", "e&o insurance", "malpractice", "property insurance", "fire insurance", "theft insurance", "workers comp", "commercial insurance", "geico", "progressive", "state farm", "allstate", "nationwide", "liberty mutual", "travelers", "chubb", "hartford"]
  },
  interest_mortgage: {
    name: "Interest (Mortgage)",
    description: "Mortgage interest paid to banks",
    keywords: ["mortgage interest", "home loan interest", "property interest", "chase mortgage", "wells fargo mortgage", "bank of america mortgage"]
  },
  interest_other: {
    name: "Interest (Other)",
    description: "Other business interest expenses",
    keywords: ["loan interest", "credit card interest", "line of credit interest", "business loan", "finance charge", "interest charge", "american express interest", "chase interest", "discover interest", "capital one interest"]
  },
  legal_professional: {
    name: "Legal and Professional Services",
    description: "Attorney, accountant, consultant fees",
    keywords: ["attorney", "lawyer", "legal", "law firm", "accountant", "cpa", "bookkeeper", "tax prep", "quickbooks", "turbotax", "h&r block", "consultant", "professional services", "notary", "audit", "legalzoom", "rocket lawyer"]
  },
  office_expense: {
    name: "Office Expense",
    description: "Office supplies and small equipment",
    keywords: ["office depot", "staples", "office supplies", "paper", "ink", "toner", "printer", "desk", "chair", "office furniture", "post-it", "pens", "folders", "binders", "envelopes", "stamps", "uline", "quill", "viking"]
  },
  pension_profit_sharing: {
    name: "Pension and Profit-Sharing Plans",
    description: "Employer contributions to retirement plans",
    keywords: ["pension contribution", "profit sharing", "sep ira", "simple ira", "employer 401k"]
  },
  rent_lease_equipment: {
    name: "Rent or Lease (Equipment)",
    description: "Equipment rental or leasing",
    keywords: ["equipment rental", "equipment lease", "copier lease", "printer lease", "machinery rental", "tool rental", "united rentals", "sunbelt rentals"]
  },
  rent_lease_property: {
    name: "Rent or Lease (Property)",
    description: "Office or business property rent",
    keywords: ["office rent", "rent", "lease payment", "commercial rent", "warehouse rent", "storage unit", "coworking", "wework", "regus", "spaces"]
  },
  repairs_maintenance: {
    name: "Repairs and Maintenance",
    description: "Repairs to business property/equipment",
    keywords: ["repair", "maintenance", "fix", "service call", "technician", "handyman", "plumber", "electrician", "hvac", "cleaning service", "janitorial", "taskrabbit", "angi", "homeadvisor"]
  },
  supplies: {
    name: "Supplies",
    description: "Materials and supplies used in business",
    keywords: ["supplies", "materials", "inventory", "raw materials", "amazon business", "wholesale", "bulk purchase", "grainger", "mcmaster-carr", "homedepot", "lowes"]
  },
  taxes_licenses: {
    name: "Taxes and Licenses",
    description: "Business taxes and license fees",
    keywords: ["business license", "permit", "registration", "state tax", "local tax", "property tax", "sales tax", "franchise tax", "license renewal", "irs", "ftb", "franchise tax board"]
  },
  travel: {
    name: "Travel",
    description: "Business travel expenses",
    keywords: ["airline", "flight", "airfare", "united", "delta", "american airlines", "southwest", "jetblue", "hotel", "marriott", "hilton", "hyatt", "airbnb", "vrbo", "lodging", "motel", "travel", "trip", "baggage fee", "expedia", "booking.com", "kayak", "orbitz", "travelocity", "priceline"]
  },
  meals: {
    name: "Meals (50% deductible)",
    description: "Business meals and entertainment",
    keywords: ["restaurant", "doordash", "ubereats", "grubhub", "postmates", "lunch", "dinner", "breakfast", "coffee", "starbucks", "cafe", "catering", "food", "mcdonald", "chipotle", "panera", "subway", "pizza", "dining"]
  },
  utilities: {
    name: "Utilities",
    description: "Electric, gas, water, phone, internet",
    keywords: ["electric", "electricity", "power", "gas bill", "water bill", "sewer", "phone", "telephone", "internet", "wifi", "broadband", "comcast", "verizon", "at&t", "t-mobile", "spectrum", "xfinity", "utility", "pg&e", "con edison", "southern california edison", "duke energy"]
  },
  wages: {
    name: "Wages",
    description: "Employee wages and salaries",
    keywords: ["payroll", "salary", "wages", "gusto", "adp", "paychex", "employee pay", "direct deposit payroll"]
  },
  home_office: {
    name: "Home Office Expenses",
    description: "Home office deduction expenses",
    keywords: ["home office", "work from home", "home internet", "home utilities"]
  },
  education_training: {
    name: "Education and Training",
    description: "Professional development and training",
    keywords: ["training", "course", "seminar", "conference", "workshop", "webinar", "udemy", "coursera", "linkedin learning", "certification", "continuing education", "tuition", "education", "pluralsight", "skillshare", "masterclass"]
  },
  software_subscriptions: {
    name: "Software and Subscriptions",
    description: "Software licenses and SaaS subscriptions",
    keywords: ["software", "subscription", "saas", "microsoft", "adobe", "zoom", "slack", "dropbox", "google workspace", "office 365", "salesforce", "hubspot", "mailchimp", "canva", "github", "aws", "azure", "heroku", "app subscription", "monthly subscription", "notion", "figma", "sketch", "invision", "jira", "trello", "asana", "netflix"]
  },
  bank_charges: {
    name: "Bank Charges",
    description: "Bank fees and service charges",
    keywords: ["bank fee", "service charge", "monthly fee", "overdraft", "wire fee", "atm fee", "account fee", "maintenance fee"]
  },
  shipping: {
    name: "Shipping and Postage",
    description: "Shipping and mailing costs",
    keywords: ["shipping", "postage", "usps", "ups", "fedex", "dhl", "mail", "freight", "courier", "stamps.com", "shipstation", "pirate ship"]
  },
  suspected_personal: {
    name: "Suspected Personal",
    description: "Expenses that may be personal and not business-related",
    keywords: ["gamestop", "steam games", "playstation", "xbox", "nintendo", "movie ticket", "cinema", "concert", "sporting event", "bar", "nightclub", "brewery", "winery", "liquor store", "casino", "lottery", "jewelry", "designer", "luxury", "boutique", "spa", "salon", "massage", "manicure", "pedicure", "gym", "fitness", "yoga", "golf", "ski", "hobby", "craft store", "pet store", "vet", "veterinarian", "toys", "disney", "vacation", "cruise", "resort", "amc theatres", "regal cinemas", "fandango", "ticketmaster", "livenation", "stubhub", "sephora", "ulta", "mac cosmetics", "loreal", "la fitness", "24 hour fitness", "equinox", "planet fitness", "soulcycle", "peloton", "michaels", "joann", "hobby lobby", "petsmart", "petco", "chewy", "toys r us", "lego store", "disneyland", "disney world", "carnival cruise", "royal caribbean", "whole foods", "wholefds", "kroger", "safeway", "albertsons", "publix", "trader joes"]
  },
  other: {
    name: "Other Expenses",
    description: "Miscellaneous business expenses",
    keywords: []
  },
  uncategorized: {
    name: "Uncategorized",
    description: "Expenses requiring manual review",
    keywords: []
  }
} as const;

/** Categorize an expense based on its description by matching against IRS category keywords. */
export function categorizeExpense(description: string): string {
  const lowerDesc = description.toLowerCase();

  for (const [categoryId, category] of Object.entries(IRS_EXPENSE_CATEGORIES)) {
    if (categoryId === 'other' || categoryId === 'uncategorized') continue;

    for (const keyword of category.keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return categoryId;
      }
    }
  }

  return 'uncategorized';
}

/** Get the display name for a category ID. */
export function getCategoryName(categoryId: string): string {
  return IRS_EXPENSE_CATEGORIES[categoryId]?.name || 'Uncategorized';
}

/** Get all categories as a flat array for dropdowns/selectors. */
export function getAllCategories(): Array<{ id: string; name: string; description: string }> {
  return Object.entries(IRS_EXPENSE_CATEGORIES).map(([id, cat]) => ({
    id,
    name: cat.name,
    description: cat.description
  }));
}
