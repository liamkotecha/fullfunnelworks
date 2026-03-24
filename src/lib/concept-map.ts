/**
 * CONCEPT MAP — Extracted from _temp/concept.html
 * Source: Growth Strategy Framework - Full Funnel (v59)
 * This file is the single source of truth for all copy, section order,
 * and form fields used throughout the intake and portal forms.
 * Do NOT alter any text in this file without client approval.
 */

// ============================================================
// NAVIGATION SECTIONS (in document order)
// ============================================================

export const NAV_SECTIONS = [
  { id: "overview",             label: "📊 Overview" },
  { id: "assessment",           label: "🔍 Assessment" },
  { id: "people",               label: "👥 People" },
  { id: "product",              label: "🎯 Product" },
  { id: "process",              label: "⚙️ Process" },
  { id: "roadmap",              label: "🗺️ Roadmap" },
  { id: "kpis",                 label: "📈 KPIs" },
  { id: "gtm",                  label: "🗺️ GTM Playbook" },
  { id: "revenue_execution",    label: "📊 Revenue Execution" },
  { id: "execution_planning",   label: "🗺️ Execution Planning" },
] as const;

export type SectionId = typeof NAV_SECTIONS[number]["id"];

// ============================================================
// BRAND COPY
// ============================================================

export const BRAND = {
  name: "FULL FUNNEL",
  tagline: "Growth Strategy Framework",
  subtitle: "Closing Capability Gaps to Enable Sustainable Growth",
  version: "v62",
} as const;

// ============================================================
// SECTION 1: OVERVIEW
// ============================================================

export const OVERVIEW_SECTION = {
  id: "overview",
  heading: "Strategic Progress Dashboard",
  subheading: "Track your implementation across all three pillars",
  frameworkCopy: `Sustainable SMB growth requires a balanced focus on People, Product, and Process. By addressing skill gaps, refining value propositions, and embedding consistent processes, businesses create the foundation for scalable growth, reduced dependency on founders, and a stronger competitive position.`,
  pillars: [
    { id: "people",  label: "People Development" },
    { id: "product", label: "Product Positioning" },
    { id: "process", label: "Process Standardization" },
  ],
  totalActionItems: 41,
  ragSections: [
    { label: "Assessment & SWOT" },
    { label: "People Development" },
    { label: "Product Positioning" },
    { label: "Process & Sales" },
  ],
  consequencesOfInaction: {
    heading: "⚠️ Consequences of Inaction",
    items: [
      "Lower conversion rates and reduced profitability",
      "Slower growth, with founders remaining the bottleneck",
      "Difficulty attracting and retaining talent without professional development",
      "Inconsistent customer experience undermining trust and repeat business",
    ],
  },
} as const;

// ============================================================
// SECTION 2: ASSESSMENT & SWOT
// ============================================================

export const ASSESSMENT_SECTION = {
  id: "assessment",
  heading: "Phase 1: Assessment & Foundation",
  intro: "Before implementing changes, conduct a comprehensive assessment of your current capabilities across People, Product, and Process.",
  checklistHeading: "Assessment Checklist",
  checklist: [
    "Map current team skills in sales, leadership, and digital communication",
    "Identify training gaps and over-reliance on founders/senior leaders",
    "Evaluate how products/services are currently presented",
    "Identify gaps between feature-led vs. outcome-led messaging",
    "Document existing sales and operational processes",
    "Identify inconsistencies, inefficiencies, and missing metrics",
    "Prioritize capability gaps by impact on growth",
    "Define quick wins vs. long-term initiatives",
    "Establish clear roles and responsibilities aligned with growth goals",
  ],
  swot: {
    heading: "SWOT Analysis",
    intro: "Complete this comprehensive SWOT analysis to understand your current position and identify areas for strategic focus.",
    weightingNote: "Weighting Criteria: For each question, rate the importance on a scale of 1-5, where: 1 = Low importance • 3 = Medium importance • 5 = High importance",
    strengths: {
      label: "STRENGTHS",
      subtitle: "What gives you real advantage today",
      questions: [
        {
          id: "swot-s1",
          question: "1. Where do your people consistently outperform competitors in winning, delivering, or retaining customers?",
          weightId: "swot-s1-weight",
        },
        {
          id: "swot-s2",
          question: "2. Which parts of your product or service are most valued by customers, and why do they choose you over alternatives?",
          weightId: "swot-s2-weight",
        },
        {
          id: "swot-s3",
          question: "3. What internal processes work well at scale and give you speed, quality, or cost advantage?",
          weightId: "swot-s3-weight",
        },
        {
          id: "swot-s4",
          question: "4. Which strengths are repeatable across teams rather than dependent on a few key individuals?",
          weightId: "swot-s4-weight",
        },
        {
          id: "swot-s5",
          question: "5. How effectively are your strengths communicated and exploited in your go-to-market activity?",
          weightId: "swot-s5-weight",
        },
      ],
    },
    weaknesses: {
      label: "WEAKNESSES",
      subtitle: "Internal constraints limiting performance",
      questions: [
        {
          id: "swot-w1",
          question: "1. Where do capability gaps in people, skills, or leadership most limit growth or execution?",
          weightId: "swot-w1-weight",
        },
        {
          id: "swot-w2",
          question: "2. Which parts of your product or service cause the most friction for customers or internal teams?",
          weightId: "swot-w2-weight",
        },
        {
          id: "swot-w3",
          question: "3. What processes are overly manual, inconsistent, or fragile under pressure?",
          weightId: "swot-w3-weight",
        },
        {
          id: "swot-w4",
          question: "4. Where does the business rely too heavily on individuals rather than documented systems and accountability?",
          weightId: "swot-w4-weight",
        },
        {
          id: "swot-w5",
          question: "5. Which weaknesses are already impacting revenue, margin, customer experience, or delivery confidence?",
          weightId: "swot-w5-weight",
        },
      ],
    },
    opportunities: {
      label: "OPPORTUNITIES",
      subtitle: "Areas to grow, improve, or reposition",
      questions: [
        {
          id: "swot-o1",
          question: "1. Where could better alignment of people, product, and process unlock near-term revenue growth?",
          weightId: "swot-o1-weight",
        },
        {
          id: "swot-o2",
          question: "2. Which customer needs or market gaps are not being fully addressed by your current offering?",
          weightId: "swot-o2-weight",
        },
        {
          id: "swot-o3",
          question: "3. What opportunities exist to simplify, automate, or standardise processes to support scale?",
          weightId: "swot-o3-weight",
        },
        {
          id: "swot-o4",
          question: "4. How could improvements in capability, structure, or incentives accelerate go-to-market performance?",
          weightId: "swot-o4-weight",
        },
        {
          id: "swot-o5",
          question: "5. Which opportunities could realistically be acted on in the next 6–12 months with focused execution?",
          weightId: "swot-o5-weight",
        },
      ],
    },
    threats: {
      label: "THREATS",
      subtitle: "Risks that could undermine performance",
      questions: [
        {
          id: "swot-t1",
          question: "1. Where are competitors, technology, or AI most likely to erode your current advantage?",
          weightId: "swot-t1-weight",
        },
        {
          id: "swot-t2",
          question: "2. Which parts of your product or service are most exposed to commoditisation or substitution?",
          weightId: "swot-t2-weight",
        },
        {
          id: "swot-t3",
          question: "3. What people-related risks exist (skills shortages, dependency on key individuals, retention)?",
          weightId: "swot-t3-weight",
        },
        {
          id: "swot-t4",
          question: "4. Where are your processes most vulnerable to failure, delay, or regulatory/compliance pressure?",
          weightId: "swot-t4-weight",
        },
        {
          id: "swot-t5",
          question: "5. Which external threats would have the greatest impact if they occurred in the next 12–24 months?",
          weightId: "swot-t5-weight",
        },
      ],
    },
  },
  most: {
    heading: "MOST Analysis",
    intro: "Assess the strength of your Mission, Objectives, Strategy, and Tactics to identify where alignment breaks down.",
    mission: {
      label: "Mission",
      intro: "Clarity of purpose and leadership alignment.",
      questions: [
        { id: "most-m1", question: "How clearly can your leadership team articulate the company's mission in a way that customers, staff, and partners would recognise and repeat?" },
        { id: "most-m2", question: "Where does your mission actively guide decision-making on people investment, product development, and customer focus today?" },
        { id: "most-m3", question: "How well does your mission reflect the real problems your customers are paying you to solve, rather than internal aspirations?" },
        { id: "most-m4", question: "To what extent does your mission differentiate you from competitors in your market?" },
        { id: "most-m5", question: "Where is there tension or inconsistency between your stated mission and how the business actually operates day to day?" },
      ],
    },
    objectives: {
      label: "Objectives",
      intro: "Measurable goals that translate mission into commercial targets.",
      questions: [
        { id: "most-o1", question: "Are your core objectives clearly defined, measurable, and understood consistently across the leadership team?" },
        { id: "most-o2", question: "How well do your objectives balance revenue growth, customer value, operational efficiency, and team capability?" },
        { id: "most-o3", question: "Which objectives directly drive go-to-market performance, and how are they tracked in real time?" },
        { id: "most-o4", question: "How confident are you that current objectives can be delivered with existing people, skills, and resources?" },
        { id: "most-o5", question: "Where are objectives competing with each other or creating friction between teams or functions?" },
      ],
    },
    strategy: {
      label: "Strategy",
      intro: "The choices you've made about where and how to compete.",
      questions: [
        { id: "most-s1", question: "How clearly have you defined where you will and will not compete in terms of customer segments, geographies, and use cases?" },
        { id: "most-s2", question: "What strategic choices have you made about target customers, segments, pricing position, and channels—and are these explicit?" },
        { id: "most-s3", question: "How well does your strategy align people capability, product roadmap, and operational process to win in your chosen market?" },
        { id: "most-s4", question: "Where does your strategy rely on individual knowledge or heroics rather than repeatable, scalable systems?" },
        { id: "most-s5", question: "What assumptions in your current strategy would cause the biggest issues if they proved to be wrong?" },
      ],
    },
    tactics: {
      label: "Tactics",
      intro: "The specific actions that execute strategy day to day.",
      questions: [
        { id: "most-t1", question: "How effectively are strategy and objectives translated into clear actions, owners, and deadlines that are reviewed regularly?" },
        { id: "most-t2", question: "Which GTM activities are genuinely repeatable and scalable—and which are ad hoc or dependent on individuals?" },
        { id: "most-t3", question: "How well do your sales, marketing, and delivery processes join up to create a consistent customer experience?" },
        { id: "most-t4", question: "Where do bottlenecks most commonly appear in execution, and what causes them?" },
        { id: "most-t5", question: "How consistently do you track progress, review performance, and adjust tactics based on real data?" },
      ],
    },
  },
  leadershipQuestions: {
    heading: "Leadership Questions",
    intro: "Ten strategic questions for commercial leadership teams to pressure-test their growth plans.",
    questions: [
      {
        id: "lq-1",
        question: "Where will growth come from over the next 12–24 months?",
        subPrompt: "Which 2–3 sectors/segments will we prioritise, and what evidence (wins, pipeline, customer outcomes) supports that choice?",
      },
      {
        id: "lq-2",
        question: "What are we known for today, and what do we want to be known for in 12 months?",
        subPrompt: "In one sentence, what problem do we solve, for whom, and why are we meaningfully better than alternatives?",
      },
      {
        id: "lq-3",
        question: "What is the single biggest blocker to predictable revenue right now?",
        subPrompt: "Is it demand generation, conversion/win rate, sales cycle length, pricing, delivery capacity, churn, or something else?",
      },
      {
        id: "lq-4",
        question: "What does 'good pipeline' mean in this business?",
        subPrompt: "What are our agreed stage definitions, entry/exit criteria, and minimum evidence required for each stage?",
      },
      {
        id: "lq-5",
        question: "How confident are we in the forecast—and why?",
        subPrompt: "What's our current forecast accuracy, what assumptions sit behind it, and where does it break down?",
      },
      {
        id: "lq-6",
        question: "What is our plan to win new logos vs expand existing accounts?",
        subPrompt: "What is different in messaging, process, roles, and success measures for new business versus upsell/cross-sell?",
      },
      {
        id: "lq-7",
        question: "What are the top 5 reasons we win and lose deals?",
        subPrompt: "Which are within our control, and what changes (product, pricing, proof points, process, people) will shift outcomes fastest?",
      },
      {
        id: "lq-8",
        question: "Do we have the right commercial leadership and structure for the next phase?",
        subPrompt: "Are roles clear across sales, marketing, CS, sales ops, and product—and where are we relying on individuals rather than a system?",
      },
      {
        id: "lq-9",
        question: "What does a 'referenceable customer' look like, and how many do we have?",
        subPrompt: "How strong is retention/renewal, what's the customer concentration risk, and where are the biggest churn or margin threats?",
      },
      {
        id: "lq-10",
        question: "What are the 3–5 actions you will personally sponsor in the next 90 days?",
        subPrompt: "For each: owner, deadline, expected commercial impact (pipeline, win rate, cycle time, retention), and how progress will be reported to the board.",
      },
    ],
  },
} as const;

// ============================================================
// SECTION 3: PEOPLE
// ============================================================

export const PEOPLE_SECTION = {
  id: "people",
  heading: "1. People: Building Capability & Alignment",
  intro: "Build capability, alignment, and confidence within the team to reduce founder dependency and scale commercial success.",
  currentChallenges: {
    heading: "Current Challenges",
    items: [
      "Lack of structured training programmes, especially in sales and customer-facing roles",
      "Over-reliance on founders/senior leaders to drive commercial success",
      "Limited investment in coaching, mentoring, or professional development",
    ],
  },
  strategicDirection: {
    heading: "Strategic Direction",
    items: [
      "Establish a consistent framework for developing staff skills (sales, leadership, digital communication)",
      "Introduce ongoing coaching and mentoring to create a culture of continuous improvement",
      "Define clear roles and responsibilities aligned with company growth goals",
      "Reduce dependency on a few individuals by building a scalable, capable team",
    ],
  },
  checklistHeading: "People Development Actions",
  checklist: [
    "Launch structured training programmes for sales skills",
    "Implement training for customer-facing roles",
    "Develop digital communication training",
    "Create leadership development programme",
    "Establish regular 1-on-1 coaching sessions",
    "Implement peer mentoring programme",
    "Create culture of continuous improvement",
    "Document best practices and standard operating procedures",
    "Enable team members to drive commercial success independently",
    "Measure skill development progress through assessments",
  ],
  teamCapabilityTracker: {
    heading: "Team Capability Tracker",
    fields: [
      { id: "member-name",       label: "Team Member Name",              type: "text",  placeholder: "Enter team member name" },
      { id: "member-role",       label: "Current Role",                  type: "text",  placeholder: "Enter role" },
      { id: "member-sales",      label: "Sales Skills (0-100)",          type: "range", min: 0, max: 100, defaultValue: 50 },
      { id: "member-digital",    label: "Digital Communication (0-100)", type: "range", min: 0, max: 100, defaultValue: 50 },
      { id: "member-leadership", label: "Leadership (0-100)",            type: "range", min: 0, max: 100, defaultValue: 50 },
      { id: "member-training",   label: "Training Completed",            type: "textarea", placeholder: "List completed training programmes" },
    ],
  },
} as const;

// ============================================================
// SECTION 4: PRODUCT
// ============================================================

export const PRODUCT_SECTION = {
  id: "product",
  heading: "2. Product: Positioning Around Customer Outcomes",
  intro: "Ensure products and services are positioned around customer outcomes, not just features.",
  currentChallenges: {
    heading: "Current Challenges",
    items: [
      "Sales teams often lead with features instead of outcomes, making offers feel generic",
      "Digital-first selling environments make it harder to build rapport and communicate value",
      "Weak solution alignment means prospects don't see how the product/service transforms their business",
    ],
  },
  strategicDirection: {
    heading: "Strategic Direction",
    items: [
      "Redefine the value proposition in terms of client transformation (\"destination\") not just features (\"plane\")",
      "Create messaging that connects product capabilities to customer-specific problems and aspirations",
      "Train teams to present solutions in the context of measurable business impact (ROI, efficiency, compliance, risk reduction)",
      "Continuously refine the offering through customer feedback and market insights",
    ],
  },
  checklistHeading: "Product Positioning Actions",
  checklist: [
    "Redefine value proposition in terms of customer transformation",
    "Shift from feature-focused to outcome-focused messaging",
    "Map product capabilities to customer problems and aspirations",
    "Create messaging framework showing ROI and efficiency gains",
    "Develop templates for different customer segments",
    "Train sales teams on articulating transformation stories",
    "Train customer-facing teams on outcome-based presentations",
    "Test new messaging with existing customers",
    "Gather customer feedback on positioning",
    "Refine messaging based on market response",
  ],
  outcomeMapper: {
    heading: "Customer Outcome Mapper",
    intro: "Transform features into customer outcomes using the framework: Feature → Problem → Outcome → Impact",
    columns: [
      { id: "outcome-feature",  label: "FEATURE",  placeholder: "Product/Feature" },
      { id: "outcome-problem",  label: "PROBLEM",  placeholder: "Customer problem" },
      { id: "outcome-outcome",  label: "OUTCOME",  placeholder: "Desired outcome" },
      { id: "outcome-impact",   label: "IMPACT",   placeholder: "Measurable impact" },
    ],
  },
} as const;

// ============================================================
// SECTION 5: PROCESS
// ============================================================

export const PROCESS_SECTION = {
  id: "process",
  heading: "3. Process: Standardize & Scale Operations",
  intro: "Standardise and strengthen the way the company operates to scale growth efficiently.",
  currentChallenges: {
    heading: "Current Challenges",
    items: [
      "Inconsistent or absent sales processes lead to wasted effort and stalled deals",
      "Ad hoc approaches across teams result in inefficiencies and uneven customer experiences",
      "Limited use of data and metrics to measure performance and inform decisions",
    ],
  },
  strategicDirection: {
    heading: "Strategic Direction",
    items: [
      "Define and embed a repeatable sales process covering qualification, problem identification, solution alignment, negotiation, and close",
      "Standardise operational workflows across the business to ensure efficiency and scalability",
      "Introduce key metrics and dashboards to monitor performance, attrition, and pipeline health",
      "Adopt a digital-first mindset, ensuring processes support both in-person and online client engagement",
    ],
  },
  checklistHeading: "Process Standardization Actions",
  checklist: [
    "Define repeatable sales process stages",
    "Document qualification criteria and methods",
    "Create problem identification framework",
    "Develop solution alignment process",
    "Standardize negotiation approaches",
    "Define closing techniques and handoff procedures",
    "Create sales playbook with best practices",
    "Document objection handling strategies",
    "Standardize operational workflows across business",
    "Introduce KPIs for conversion rates, cycle times, pipeline health",
    "Create dashboards to monitor team performance",
    "Implement digital-first workflows for in-person and online engagement",
  ],
  salesCapabilityMethodology: {
    heading: "SMB Sales Capability Methodology",
    intro: "A structured 5-phase approach to closing capability gaps and unlocking sustainable sales growth.",
    phases: [
      {
        number: 1,
        title: "Discovery & Visioning",
        objective: "Uncover the current state of sales skills, processes, and outcomes in the SMB.",
        points: [
          "Map out the sales team's current practices (training, process, tools)",
          "Identify where sales are being lost (qualification, problem identification, negotiation, close)",
          "Align with leadership on what \"sales growth success\" looks like",
        ],
        questions: [
          { id: "discovery-q1", label: "What would success in your sales organisation look like in 12 months?" },
          { id: "discovery-q2", label: "Where do deals typically stall or go cold today?" },
          { id: "discovery-q3", label: "Who carries the sales burden — and what happens if they step back?" },
        ],
      },
      {
        number: 2,
        title: "Impact Framing",
        objective: "Translate capability gaps into measurable business impact.",
        points: [
          "Link training deficits, missing online selling skills, and inconsistent processes to lost revenue",
          "Quantify the cost of missed opportunities, slower cycles, and low conversion rates",
          "Frame sales capability development as an investment into growth, not a cost",
        ],
        questions: [
          { id: "impact-q1", label: "How much revenue do you think was lost last quarter due to weak qualification or discounting?" },
          { id: "impact-q2", label: "If we improved conversion by 10%, what impact would that have on your growth targets?" },
          { id: "impact-q3", label: "How often do you see deals stuck with no clear next step?" },
        ],
      },
      {
        number: 3,
        title: "Future Narrative",
        objective: "Paint a compelling picture of the transformed sales organisation.",
        points: [
          "Salespeople follow a consistent, standardised process from qualification to close",
          "Teams are confident selling online, building trust through digital-first interactions",
          "Training, coaching, and mentoring create repeatable success across the team",
          "Founders step back from day-to-day selling, enabling scalability",
        ],
        questions: [
          { id: "future-q1", label: "If every salesperson followed a clear sales playbook, how would that change your growth trajectory?" },
          { id: "future-q2", label: "What would freeing your founders from frontline sales allow them to focus on?" },
          { id: "future-q3", label: "How would your customers experience a better buying journey with a more skilled sales team?" },
        ],
      },
      {
        number: 4,
        title: "Proof of Journey",
        objective: "Show credibility and evidence that transformation is possible.",
        points: [
          "Provide case studies of SMBs who built sales capability and saw growth",
          "Share benchmarks (conversion rates, cycle times) before and after training/process adoption",
          "Position your methodology as the \"plane\" — the trusted vehicle that gets them to their \"destination\"",
        ],
        questions: [
          { id: "proof-q1", label: "Would you like to see examples of how other SMBs improved conversion and growth through capability development?" },
          { id: "proof-q2", label: "What benchmarks would convince you this is achievable?" },
        ],
      },
      {
        number: 5,
        title: "Commitment & Momentum",
        objective: "Drive urgency and action.",
        points: [
          "Highlight the risk of doing nothing — continued stagnation, missed deals, founder burnout",
          "Define a clear roadmap: Assess → Train → Standardise",
          "Reinforce that AI/automation can support efficiency, but human sales skill drives revenue",
        ],
        questions: [
          { id: "commitment-q1", label: "What's the risk to your business if you delay fixing these gaps another 6 months?" },
          { id: "commitment-q2", label: "Are you willing to invest in building sales as a growth engine, not just a function?" },
          { id: "commitment-q3", label: "When would you like to see your first measurable improvements in sales results?" },
        ],
      },
    ],
  },
  salesProcessBuilder: {
    heading: "Sales Process Builder",
    stages: [
      {
        id: "qualification",
        label: "1. Qualification",
        heading: "Qualification Stage",
        fields: [
          { label: "Qualification Criteria",  placeholder: "Define your qualification criteria (budget, authority, need, timeline)" },
          { label: "Key Questions to Ask",    placeholder: "List key qualification questions" },
        ],
      },
      {
        id: "discovery",
        label: "2. Discovery",
        heading: "Discovery Stage",
        fields: [
          { label: "Problem Identification Questions", placeholder: "Questions to uncover customer problems and pain points" },
          { label: "Current State Assessment",         placeholder: "How to assess their current situation" },
        ],
      },
      {
        id: "solution",
        label: "3. Solution",
        heading: "Solution Alignment Stage",
        fields: [
          { label: "Solution Presentation Framework", placeholder: "How to present solutions tied to outcomes" },
          { label: "ROI/Value Demonstration",         placeholder: "How to demonstrate measurable value" },
        ],
      },
      {
        id: "negotiation",
        label: "4. Negotiation",
        heading: "Negotiation Stage",
        fields: [
          { label: "Objection Handling", placeholder: "Common objections and responses" },
          { label: "Pricing Strategy",   placeholder: "Pricing framework and negotiation boundaries" },
        ],
      },
      {
        id: "close",
        label: "5. Close",
        heading: "Close Stage",
        fields: [
          { label: "Closing Techniques",      placeholder: "Effective closing approaches" },
          { label: "Onboarding Transition",   placeholder: "How to transition from sale to delivery" },
        ],
      },
    ],
  },
} as const;

// ============================================================
// SECTION 6: ROADMAP
// ============================================================

export const ROADMAP_SECTION = {
  id: "roadmap",
  heading: "5-Phase Strategic Roadmap",
  intro: "A structured implementation plan to transform your business across People, Product, and Process.",
  phases: [
    {
      number: 1,
      title: "Assessment Phase",
      duration: "Month 1-2",
      items: [
        "Map people, product, and process capabilities",
        "Identify priority gaps affecting growth",
        "Define clear roles and responsibilities",
        "Establish baseline metrics and KPIs",
      ],
    },
    {
      number: 2,
      title: "Capability Building",
      duration: "Month 3-5",
      items: [
        "Launch structured training (sales, digital engagement, leadership)",
        "Implement coaching/mentoring programmes",
        "Build scalable team capability",
        "Reduce founder dependency",
      ],
    },
    {
      number: 3,
      title: "Product Positioning",
      duration: "Month 4-6",
      items: [
        "Refresh value proposition and customer-facing messaging",
        "Link product outcomes directly to customer impact",
        "Train teams on outcome-based selling",
        "Test messaging with existing customers",
      ],
    },
    {
      number: 4,
      title: "Process Alignment",
      duration: "Month 6-8",
      items: [
        "Roll out standardised sales playbook",
        "Integrate digital-first tools and workflows",
        "Implement KPI tracking and dashboards",
        "Standardise operational processes",
      ],
    },
    {
      number: 5,
      title: "Monitoring & Scaling",
      duration: "Month 9+",
      items: [
        "Track KPIs (conversion rates, cycle times, customer success)",
        "Refine strategy quarterly based on data and feedback",
        "Scale processes as team grows",
        "Build culture of continuous improvement",
      ],
    },
  ],
} as const;

// ============================================================
// SECTION 7: KPIs
// ============================================================

export const KPIS_SECTION = {
  id: "kpis",
  heading: "Key Performance Indicators",
  intro: "Monitor these metrics to measure your growth strategy success.",
  companyKPIsHeading: "Company KPIs",
  departmentKPIsHeading: "Department KPIs",
  companyKPIPlaceholders: [
    { namePlaceholder: "e.g., Monthly Revenue Growth",      outcomePlaceholder: "e.g., Increase by 15% QoQ" },
    { namePlaceholder: "e.g., Customer Acquisition Cost",   outcomePlaceholder: "e.g., Reduce to under £500" },
    { namePlaceholder: "e.g., Customer Retention Rate",     outcomePlaceholder: "e.g., Maintain above 85%" },
    { namePlaceholder: "e.g., Net Profit Margin",           outcomePlaceholder: "e.g., Achieve 20%" },
    { namePlaceholder: "e.g., Employee Satisfaction Score", outcomePlaceholder: "e.g., Score above 4.0/5.0" },
  ],
  deptKPIPlaceholders: [
    { namePlaceholder: "e.g., Sales Conversion Rate",   outcomePlaceholder: "e.g., Increase to 25%" },
    { namePlaceholder: "e.g., Average Deal Size",        outcomePlaceholder: "e.g., Increase to £50k" },
    { namePlaceholder: "e.g., Sales Cycle Time",         outcomePlaceholder: "e.g., Reduce to 45 days" },
    { namePlaceholder: "e.g., Lead Response Time",       outcomePlaceholder: "e.g., Under 2 hours" },
    { namePlaceholder: "e.g., Pipeline Value",           outcomePlaceholder: "e.g., Maintain £2M+" },
  ],
} as const;

// ============================================================
// GTM PLAYBOOK SECTION (new in v62)
// ============================================================

export const GTM_SECTION = {
  id: "gtm",
  heading: "GTM Playbook",
  competition: {
    heading: "Competition",
    subsections: [
      {
        number: 1,
        title: "Mapping the Competitive Landscape",
        italic: "If we don't have a complete view of who customers compare us to (including substitutes), we'll misprice, mis-position, and lose deals we never saw coming.",
        questions: [
          { id: "comp-1-1", question: "When a buyer is choosing instead of us, what are the top 3\u20135 alternatives (direct, indirect, \u201cdo nothing\u201d, in-house)?" },
          { id: "comp-1-2", question: "Which competitors show up most often in live deals, and in which segments/use cases?" },
          { id: "comp-1-3", question: "Where do we win vs. lose by competitor type (direct vs indirect vs substitute), and why?" },
          { id: "comp-1-4", question: "If we plotted the market by price vs value/outcomes, where do we sit today\u2014and is that where we want to sit?" },
          { id: "comp-1-5", question: "What\u2019s the one competitor or substitute most likely to hurt our next 12 months\u2019 growth, and what\u2019s our plan to blunt it?" },
        ],
      },
      {
        number: 2,
        title: "Analysing Competitor Strengths and Weaknesses",
        italic: "We need a fact-based view of what competitors do better than us (and where they fall short) so we can choose battles and build advantages.",
        questions: [
          { id: "comp-2-1", question: "Which competitor is best-in-class on product, delivery, and customer experience\u2014and what specifically are they doing better?" },
          { id: "comp-2-2", question: "Where are competitors consistently weak (service, onboarding, reliability, support, flexibility, reporting, compliance, integrations, etc.)?" },
          { id: "comp-2-3", question: "Which features/outcomes are \u201ctable stakes\u201d now, and which are true differentiators that buyers pay for?" },
          { id: "comp-2-4", question: "What do competitor reviews and churn signals suggest buyers love and hate\u2014and how does that map to our roadmap?" },
          { id: "comp-2-5", question: "Where are we choosing to compete head-to-head today, and is that a smart use of time and investment?" },
        ],
      },
      {
        number: 3,
        title: "Understanding Competitor Positioning",
        italic: "The market doesn\u2019t buy our internal story\u2014it buys what it understands quickly. Positioning is how we get chosen.",
        questions: [
          { id: "comp-3-1", question: "In one sentence, what do we want to be known for, and is that different from what competitors claim?" },
          { id: "comp-3-2", question: "What do buyers believe is our primary advantage today (price, outcomes, speed, trust, expertise, niche focus, innovation, service)?" },
          { id: "comp-3-3", question: "Which customer segments are we best suited to win (and which should we stop chasing)?" },
          { id: "comp-3-4", question: "Where is our messaging vague or generic\u2014and what proof points (metrics, case studies, guarantees) do we use to back it up?" },
          { id: "comp-3-5", question: "What\u2019s the clearest \u201cwhy us\u201d that sales can use in the first 60 seconds of a call\u2014and does it stand up against top competitors?" },
        ],
      },
      {
        number: 4,
        title: "Monitoring Competitor Activity",
        italic: "Competitive shifts happen quietly (pricing moves, feature releases, hiring). If we spot them late, we pay for it in lost pipeline and margin.",
        questions: [
          { id: "comp-4-1", question: "What competitor moves would force us to respond immediately (pricing, bundling, new product line, partnerships, platform shift)?" },
          { id: "comp-4-2", question: "How do we track competitor pricing, packaging, and discounting\u2014and what have we learned in the last 90 days?" },
          { id: "comp-4-3", question: "What product updates have competitors shipped recently that buyers are talking about, and what\u2019s our response (build/partner/ignore)?" },
          { id: "comp-4-4", question: "What do competitor hiring patterns tell us about where they\u2019re investing (sales, product, delivery, CS, AI, compliance)?" },
          { id: "comp-4-5", question: "Who owns competitor intelligence internally, and how often does the exec team review it with decisions attached?" },
        ],
      },
      {
        number: 5,
        title: "Turning Insights Into Action",
        italic: "Competitive knowledge only matters if it changes how we sell, build, price, and deliver\u2014fast enough to show up in revenue.",
        questions: [
          { id: "comp-5-1", question: "What are the top 3 changes we can make in the next 90 days that would increase win-rate or ASP (offer, proof, packaging, onboarding, guarantees)?" },
          { id: "comp-5-2", question: "Where do we need sales plays (competitor talk tracks, objection handling, battlecards) to protect pipeline and close faster?" },
          { id: "comp-5-3", question: "Which differentiators can we productise (features, services, SLAs, outcomes, implementation speed) so buyers can\u2019t easily compare us on price?" },
          { id: "comp-5-4", question: "What should we stop doing (features, segments, channels, custom work) because it drags margin and doesn\u2019t help us beat competitors?" },
          { id: "comp-5-5", question: "What 3 measurable outcomes will prove we\u2019re winning (win-rate vs top 3 competitors, churn, NRR, sales cycle time, margin, conversion)?" },
        ],
      },
    ],
  },
  marketplace: {
    heading: "Marketplace",
    intro: "C-Level Review: Understanding Your Marketplace",
    subIntro: "Each question asks (a) what you do now and (b) what you will put in place next. Max 50 words per box.",
    subsections: [
      {
        number: 1,
        title: "Knowing Your Customers",
        italic: "Growth slows when we guess customer needs and buying behaviour instead of proving them.",
        questions: [
          { id: "mkt-1-1", label: "Customer personas", question: "What customer personas do you currently use (and how are they evidenced), and what additional persona work will you complete in the next 30\u201360 days to improve targeting and conversion?" },
          { id: "mkt-1-2", label: "Talk to customers regularly", question: "How often do you speak to customers/prospects today (structured and unstructured), and what new cadence, method, and ownership will you implement to capture insight that directly influences pipeline and retention?" },
          { id: "mkt-1-3", label: "Map the buyer journey", question: "What buyer journey map do you currently have (stages, questions, content, decision criteria), and what additional mapping will you do to remove friction, shorten sales cycles, and increase win-rate?" },
          { id: "mkt-1-4", label: "Segment the audience", question: "How do you segment customers today (sector/size/needs/behaviour), and what additional segmentation will you introduce to focus spend, improve messaging relevance, and lift conversion and margin?" },
          { id: "mkt-1-5", label: "Customer needs & decision drivers", question: "What do you currently believe are the top decision drivers (value, risk, compliance, ROI, speed), and what additional validation will you run to prove what actually drives purchase and renewal?" },
        ],
      },
      {
        number: 2,
        title: "Understanding Competitors",
        italic: "If you don\u2019t know who you\u2019re compared to and why, you\u2019ll lose deals on price, confidence, or clarity.",
        questions: [
          { id: "mkt-2-1", label: "Competitor mapping", question: "How do you currently map direct/indirect competitors (offer, pricing, positioning), and what additional work will you implement to keep the map current and usable in sales and product decisions?" },
          { id: "mkt-2-2", label: "SWOT vs competitors", question: "What competitive SWOT do we currently maintain (where we win/lose), and what additional analysis will you complete to identify the few differentiators that will increase win-rate and defend margin?" },
          { id: "mkt-2-3", label: "Mystery shopping", question: "What do you currently do to experience competitor sales motions (demos, trials, onboarding, pricing), and what additional mystery shopping will we run to improve our sales process and conversion?" },
          { id: "mkt-2-4", label: "Differentiate clearly", question: "How do you currently communicate differentiation (proof points, outcomes, case studies), and what additional steps will you take to make the \u201cwhy us\u201d unmistakable in the first minute of any sales conversation?" },
          { id: "mkt-2-5", label: "Pricing realism", question: "How do you currently validate pricing against competitor reality and willingness-to-pay, and what additional steps will you implement to protect margin while staying credible in-market?" },
        ],
      },
      {
        number: 3,
        title: "Tracking Industry Trends",
        italic: "Markets move; if you\u2019re reacting late, you pay for it in missed opportunities and product irrelevance.",
        questions: [
          { id: "mkt-3-1", label: "Follow trade media", question: "What trade sources do you track today (and how insights are captured), and what additional subscriptions/summary process will you implement so trends turn into decisions that drive growth?" },
          { id: "mkt-3-2", label: "Attend events/webinars", question: "What events do you currently attend (and what we take back), and what additional event plans will you implement to increase partnerships, pipeline, and product insight?" },
          { id: "mkt-3-3", label: "Alerts and feeds", question: "What alerts/feeds do you currently run (topics, competitors, regulation), and what additional alerting/reporting will you implement to surface \u2018early signals\u2019 that affect revenue?" },
          { id: "mkt-3-4", label: "Scan adjacent industries", question: "Where do you currently look outside your sector for innovation, and what additional scanning will we implement to spot new routes to value, packaging, or delivery?" },
          { id: "mkt-3-5", label: "Trend-to-roadmap link", question: "How do you currently translate trends into roadmap, messaging, and sales plays, and what additional governance will you implement to ensure trends create measurable growth impact?" },
        ],
      },
      {
        number: 4,
        title: "External Forces and Environment",
        italic: "External change can create sudden demand shocks or compliance risk; we need early visibility and prepared responses.",
        questions: [
          { id: "mkt-4-1", label: "PESTLE analysis (Political, Economic, Social, Technological, Legal, Environmental)", question: "What PESTLE review do you currently run (frequency, ownership), and what additional structure will you implement so it directly informs priorities, investment, and risk management?" },
          { id: "mkt-4-2", label: "Regulatory watch", question: "How do you currently track standards/compliance/legislation, and what additional monitoring and accountability will you implement to avoid surprises and strengthen trust in sales?" },
          { id: "mkt-4-3", label: "Economic indicators", question: "What indicators do you currently track that affect customer budgets (inflation, rates, funding trends), and what additional metrics will you add to anticipate buying freezes or spending shifts?" },
          { id: "mkt-4-4", label: "Scenario planning", question: "What scenarios have you planned for (pricing pressure, cost rises, regulation change), and what additional \u2018what if\u2019 scenarios will you build with pre-agreed actions to protect revenue?" },
          { id: "mkt-4-5", label: "Opportunity capture", question: "What external shifts could create a growth tailwind for you (policy, tech adoption, funding), and what additional steps will you implement to move early and win disproportionate share?" },
        ],
      },
      {
        number: 5,
        title: "Turning Insights Into Action",
        italic: "Market understanding only pays off when it changes what we build, sell, and prioritise\u2014fast enough to show up in results.",
        questions: [
          { id: "mkt-5-1", label: "Share findings internally", question: "How do you currently share market insight (format, cadence, audience), and what additional rhythm will you implement so insight turns into clear decisions and accountability?" },
          { id: "mkt-5-2", label: "Refine value proposition", question: "What is your current value proposition and proof, and what additional refinement will you make based on evidence (wins/losses/voice of customer) to lift conversion and pricing power?" },
          { id: "mkt-5-3", label: "Test and iterate", question: "How do you currently test messaging/offers/channels, and what additional experiments will you run to find what drives pipeline efficiently before scaling spend?" },
          { id: "mkt-5-4", label: "Make it ongoing", question: "What ongoing process do you currently have for market understanding, and what additional governance will you implement (owners, KPIs, review cadence) so this is continuous, not ad hoc?" },
          { id: "mkt-5-5", label: "Decisions and measures", question: "What decisions have you changed in the last quarter due to market insight, and what additional measures will you track (win-rate, ASP, churn, sales cycle, CAC) to prove impact on revenue and growth?" },
        ],
      },
    ],
  },
} as const;

// ============================================================
// ALL INTAKE FIELD IDs (for IntakeResponse keying)
// ============================================================

export const ALL_FIELD_IDS = [
  // Assessment checklist
  ...ASSESSMENT_SECTION.checklist.map((_, i) => `assessment-${i}`),
  // SWOT fields
  ...ASSESSMENT_SECTION.swot.strengths.questions.map(q => q.id),
  ...ASSESSMENT_SECTION.swot.strengths.questions.map(q => q.weightId),
  ...ASSESSMENT_SECTION.swot.weaknesses.questions.map(q => q.id),
  ...ASSESSMENT_SECTION.swot.weaknesses.questions.map(q => q.weightId),
  ...ASSESSMENT_SECTION.swot.opportunities.questions.map(q => q.id),
  ...ASSESSMENT_SECTION.swot.opportunities.questions.map(q => q.weightId),
  ...ASSESSMENT_SECTION.swot.threats.questions.map(q => q.id),
  ...ASSESSMENT_SECTION.swot.threats.questions.map(q => q.weightId),
  // People checklist
  ...PEOPLE_SECTION.checklist.map((_, i) => `people-${i}`),
  // Team capability
  "member-name", "member-role", "member-sales", "member-digital", "member-leadership", "member-training",
  // Product checklist
  ...PRODUCT_SECTION.checklist.map((_, i) => `product-${i}`),
  // Outcome mapper
  ...PRODUCT_SECTION.outcomeMapper.columns.map(c => c.id),
  // Process checklist
  ...PROCESS_SECTION.checklist.map((_, i) => `process-${i}`),
  // Sales methodology questions
  ...PROCESS_SECTION.salesCapabilityMethodology.phases.flatMap(p => p.questions.map(q => q.id)),
  // KPI fields
  ...KPIS_SECTION.companyKPIPlaceholders.map((_, i) => `company-kpi${i + 1}-name`),
  ...KPIS_SECTION.companyKPIPlaceholders.map((_, i) => `company-kpi${i + 1}-outcome`),
  ...KPIS_SECTION.companyKPIPlaceholders.map((_, i) => `company-kpi${i + 1}-completed`),
  ...KPIS_SECTION.deptKPIPlaceholders.map((_, i) => `dept-kpi${i + 1}-name`),
  ...KPIS_SECTION.deptKPIPlaceholders.map((_, i) => `dept-kpi${i + 1}-outcome`),
  ...KPIS_SECTION.deptKPIPlaceholders.map((_, i) => `dept-kpi${i + 1}-completed`),
] as const;

// ============================================================
// INTAKE SECTIONS (ordered exactly as in HTML — do not reorder)
// ============================================================

export const INTAKE_SECTIONS_ORDERED = [
  { id: "overview",    label: "Overview",          section: OVERVIEW_SECTION },
  { id: "assessment",  label: "Assessment & SWOT",  section: ASSESSMENT_SECTION },
  { id: "people",      label: "People",             section: PEOPLE_SECTION },
  { id: "product",     label: "Product",            section: PRODUCT_SECTION },
  { id: "process",     label: "Process",            section: PROCESS_SECTION },
  { id: "roadmap",     label: "Roadmap",            section: ROADMAP_SECTION },
  { id: "kpis",        label: "KPIs",               section: KPIS_SECTION },
] as const;

// ============================================================
// SECTION 2: REVENUE EXECUTION, ADOPTION & PERFORMANCE
// Source: FF_Framework_Sections2and3_v64 + Section 2 Consultant Guide
// ============================================================

export const REVENUE_EXECUTION_SECTION = {
  id: "revenue_execution",
  heading: "Revenue Execution, Adoption & Performance Management",
  intro: "This section translates the initial review into a repeatable commercial operating model. It focuses on sales methodology adoption, CRM-led performance management, campaign measurement, leadership ownership, and a balanced scorecard linking revenue, pipeline, process discipline and people capability.",
  modules: {
    // ── 2.1 Sales Methodology Selection, Fit & Design ──
    methodology: {
      id: "s2-methodology",
      number: "2.1",
      title: "Sales Methodology Selection, Fit & Design",
      purpose: "Confirm the chosen methodology matches the customer journey, buying process, sales cycle and commercial objectives.",
      guidance: "Customer journey map; stage design; qualification criteria; evidence required at each stage; playbooks and templates.",
      fields: [
        { id: "s2-methodology-current", type: "select", question: "Current Sales Methodology", options: ["MEDDIC", "SPIN Selling", "Challenger Sale", "Solution Selling", "Value Selling", "Sandler System", "No formal methodology", "Custom/Hybrid"] },
        { id: "s2-methodology-fit", type: "select", question: "Methodology Fit Assessment", options: ["Strong fit", "Good fit", "Partial fit", "Poor fit"] },
        { id: "s2-methodology-journey", type: "textarea", question: "Customer Journey — Describe how your customer moves from awareness to purchase and how the methodology maps to each stage." },
        { id: "s2-methodology-qual", type: "textarea", question: "Qualification Criteria — What evidence is required to qualify an opportunity at each pipeline stage?" },
      ],
      measures: [
        { id: "s2-methodology-m1", label: "Stage conversion rate (%)" },
        { id: "s2-methodology-m2", label: "Win rate (%)" },
        { id: "s2-methodology-m3", label: "Average sales cycle (days)" },
        { id: "s2-methodology-m4", label: "Average contract value (£)" },
        { id: "s2-methodology-m5", label: "% opportunities with full stage evidence" },
      ],
    },

    // ── 2.2 Adoption & Embedding Programme ──
    adoption: {
      id: "s2-adoption",
      number: "2.2",
      title: "Adoption & Embedding Programme",
      purpose: "Turn the methodology into everyday selling and management behaviour over a sustained period.",
      guidance: "6-12 month adoption plan; leadership modelling; weekly deal reviews; coaching rhythm; reinforcement activities; internal communications.",
      fields: [
        { id: "s2-adoption-duration", type: "select", question: "Adoption Programme Duration", options: ["6 months", "9 months", "12 months", "12+ months"] },
        { id: "s2-adoption-coaching", type: "select", question: "Coaching Cadence Agreed", options: ["Weekly", "Bi-weekly", "Monthly", "Not established"] },
        { id: "s2-adoption-leadership", type: "textarea", question: "Leadership Modelling Commitment — How will managers and senior leaders model the agreed methodology in deal reviews, forecasting and coaching?" },
        { id: "s2-adoption-reinforce", type: "textarea", question: "Reinforcement Activities Planned — What activities will sustain adoption beyond initial training (deal reviews, competitions, internal comms)?" },
      ],
      measures: [
        { id: "s2-adoption-m1", label: "% team trained on methodology" },
        { id: "s2-adoption-m2", label: "% managers coaching monthly" },
        { id: "s2-adoption-m3", label: "% pipeline reviewed using agreed criteria" },
        { id: "s2-adoption-m4", label: "Adoption score (1–10)" },
        { id: "s2-adoption-m5", label: "Time-to-competence for new starters" },
      ],
    },

    // ── 2.3 Commercial Leadership & Named Ownership ──
    ownership: {
      id: "s2-ownership",
      number: "2.3",
      title: "Commercial Leadership & Named Ownership",
      purpose: "Assign clear accountability so methodology adoption, reporting and campaign control do not sit in a grey area.",
      guidance: "Executive sponsor; methodology owner; CRM owner; campaign owner; sales manager responsibilities; escalation route.",
      ownershipRoles: [
        { role: "Executive Sponsor", responsibility: "Leads quarterly review, removes blockers, reinforces leadership discipline." },
        { role: "Methodology Owner", responsibility: "Maintains methodology, stage definitions, tools and reinforcement plan." },
        { role: "CRM Owner / RevOps", responsibility: "Maintains data quality, dashboards, workflow rules and reporting accuracy." },
        { role: "Marketing Lead", responsibility: "Owns campaign plans, predicted outcomes, attribution and review of actual results." },
        { role: "Sales Leaders / Managers", responsibility: "Run coaching, deal inspections, pipeline reviews and performance interventions." },
        { role: "People Lead", responsibility: "Integrates adoption into recruitment, induction, skills development and performance review." },
      ],
      fields: [
        { id: "s2-ownership-escalation", type: "textarea", question: "Escalation Route — Define the escalation path when adoption, reporting or campaign issues are not resolved at team level." },
      ],
      measures: [
        { id: "s2-ownership-m1", label: "Ownership matrix completed (%)" },
        { id: "s2-ownership-m2", label: "% actions closed on time" },
        { id: "s2-ownership-m3", label: "Review attendance rate (%)" },
      ],
    },

    // ── 2.4 CRM Integration & Revenue Process Control ──
    crm: {
      id: "s2-crm",
      number: "2.4",
      title: "CRM Integration & Revenue Process Control",
      purpose: "Embed the methodology into the CRM so it becomes the operating system for pipeline control and forecasting.",
      guidance: "Stage architecture; mandatory fields; opportunity scoring; next-step discipline; lost-reason tracking; dashboard pack; data governance.",
      fields: [
        { id: "s2-crm-platform", type: "select", question: "CRM Platform in Use", options: ["Salesforce", "HubSpot", "Dynamics 365", "Pipedrive", "Zoho", "Monday CRM", "Other", "No CRM"] },
        { id: "s2-crm-quality", type: "select", question: "CRM Data Quality Assessment", options: ["Excellent", "Good", "Poor", "Very poor"] },
        { id: "s2-crm-fields", type: "textarea", question: "Mandatory Fields — List the fields that must be completed at each pipeline stage to maintain data integrity." },
        { id: "s2-crm-dashboards", type: "textarea", question: "Dashboard Pack / Reports Required — What dashboards and reports does leadership need to manage pipeline, forecasting and performance?" },
      ],
      measures: [
        { id: "s2-crm-m1", label: "CRM completeness (%)" },
        { id: "s2-crm-m2", label: "Forecast accuracy (%)" },
        { id: "s2-crm-m3", label: "Pipeline coverage ratio" },
        { id: "s2-crm-m4", label: "% opps with next step & close date" },
      ],
    },

    // ── 2.5 Marketing Campaign Performance & Predicted Outcomes ──
    campaigns: {
      id: "s2-campaigns",
      number: "2.5",
      title: "Marketing Campaign Performance & Predicted Outcomes",
      purpose: "Link campaigns to strategic objectives and track predicted versus actual commercial outcomes.",
      guidance: "Campaign hypotheses; channel plan; source attribution; MQL/SQL definitions; campaign review process; forecast versus actual reporting.",
      fields: [
        { id: "s2-campaigns-calendar", type: "textarea", question: "Current Campaign Calendar Summary — Outline the active and planned campaigns for the current quarter." },
        { id: "s2-campaigns-mql", type: "select", question: "MQL Definition Agreed", options: ["Yes — clearly defined", "Informally agreed", "No — not defined"] },
        { id: "s2-campaigns-sql", type: "select", question: "SQL Definition Agreed", options: ["Yes — clearly defined", "Informally agreed", "No — not defined"] },
        { id: "s2-campaigns-objective", type: "textarea", question: "Campaign Objective — What commercial issue or growth priority is being addressed?" },
        { id: "s2-campaigns-audience", type: "textarea", question: "Target Audience — Which sector, persona, account tier or buyer group is being targeted?" },
        { id: "s2-campaigns-predicted", type: "textarea", question: "Predicted Outcome — Expected leads, MQLs, SQLs, meetings, pipeline value and revenue influence." },
        { id: "s2-campaigns-actual", type: "textarea", question: "Actual Result — Measured output by source, quality and conversion." },
        { id: "s2-campaigns-review", type: "textarea", question: "Commercial Review — What worked, what did not, and what should change next?" },
      ],
      measures: [
        { id: "s2-campaigns-m1", label: "Lead volume (monthly)" },
        { id: "s2-campaigns-m2", label: "MQL to SQL conversion (%)" },
        { id: "s2-campaigns-m3", label: "Cost per SQL (£)" },
        { id: "s2-campaigns-m4", label: "Pipeline generated by marketing (£)" },
        { id: "s2-campaigns-m5", label: "Campaign ROI" },
      ],
    },

    // ── 2.6 Sales Performance Management & Balanced Scorecard ──
    scorecard: {
      id: "s2-scorecard",
      number: "2.6",
      title: "Sales Performance Management & Balanced Scorecard",
      purpose: "Measure revenue, customer outcomes, process discipline and people capability in one joined-up view.",
      guidance: "Monthly scorecard; team and individual dashboards; RAG status by objective; action tracker.",
      scorecardAreas: [
        {
          area: "Financial",
          measures: [
            { id: "s2-scorecard-fin1", label: "Revenue vs target (%)" },
            { id: "s2-scorecard-fin2", label: "New business revenue (£)" },
            { id: "s2-scorecard-fin3", label: "Average deal value (£)" },
          ],
        },
        {
          area: "Customer & Market",
          measures: [
            { id: "s2-scorecard-cust1", label: "Win rate (%)" },
            { id: "s2-scorecard-cust2", label: "Customer renewal & retention (%)" },
            { id: "s2-scorecard-cust3", label: "Referenceable customers (count)" },
          ],
        },
        {
          area: "Internal Process",
          measures: [
            { id: "s2-scorecard-proc1", label: "Pipeline coverage ratio" },
            { id: "s2-scorecard-proc2", label: "CRM compliance (%)" },
          ],
        },
        {
          area: "People & Capability",
          measures: [
            { id: "s2-scorecard-ppl1", label: "Methodology adoption score (1–10)" },
            { id: "s2-scorecard-ppl2", label: "Retention of key staff (%)" },
          ],
        },
      ],
      fields: [
        { id: "s2-scorecard-narrative", type: "textarea", question: "Scorecard Narrative — Summarise the current quarter performance and any areas requiring intervention." },
      ],
    },

    // ── 2.7 Quarterly Business Review & Annual Growth Reset ──
    qbr: {
      id: "s2-qbr",
      number: "2.7",
      title: "Quarterly Business Review & Annual Growth Reset",
      purpose: "Formalise review cycles to maintain focus, respond to change and reset priorities.",
      guidance: "Quarterly business reviews; annual commercial review; issue log; corrective action plan; next-year priorities.",
      fields: [
        { id: "s2-qbr-date", type: "text", question: "Next QBR Date" },
        { id: "s2-qbr-agenda", type: "textarea", question: "QBR Format / Agenda — Outline the planned agenda for the next quarterly business review." },
      ],
    },

    // ── 2.8 People, Capability & Performance Development ──
    peopleCap: {
      id: "s2-people-cap",
      number: "2.8",
      title: "People, Capability & Performance Development",
      purpose: "Make methodology adoption part of hiring, onboarding, development and performance review.",
      guidance: "Competency framework; onboarding pathway; manager coaching standards; reward and recognition; succession coverage.",
      fields: [
        { id: "s2-people-cap-framework", type: "select", question: "Competency Framework Status", options: ["In place", "Partially defined", "Not in place"] },
        { id: "s2-people-cap-succession", type: "select", question: "Succession Coverage", options: ["Full coverage", "Partial coverage", "No succession planning"] },
        { id: "s2-people-cap-gaps", type: "textarea", question: "Identified Capability Gaps — List the key capability gaps in the commercial team and the plan to address them." },
      ],
      measures: [
        { id: "s2-people-cap-m1", label: "Skills gap closure (%)" },
        { id: "s2-people-cap-m2", label: "Attrition of key staff (%)" },
        { id: "s2-people-cap-m3", label: "Succession readiness (1–5)" },
      ],
    },
  },
  challengeQuestions: [
    "Which sales methodology best fits our customer journey and where is it currently not being followed?",
    "Who owns adoption across leadership, sales, marketing, CRM and people development, and how will they be measured?",
    "How will the CRM be configured so stage discipline, forecast confidence and individual accountability can be managed properly?",
    "What campaign outcomes are being predicted in advance and how often are forecast versus actual results reviewed together?",
    "What balanced scorecard will leadership use monthly, quarterly and annually to judge progress against objectives, revenue and people capability?",
  ],
} as const;

// ============================================================
// SECTION 3: EXECUTION PLANNING, ACCOUNTABILITY & GROWTH DELIVERY
// Source: FF_Framework_Sections2and3_v64 + Section 3 Consultant Guide
// ============================================================

export const EXECUTION_PLANNING_SECTION = {
  id: "execution_planning",
  heading: "Execution Planning, Accountability & Growth Delivery",
  intro: "This section converts the commercial operating model into an execution programme. It defines 90-day priorities, ownership by function, board and leadership review cadence, delivery controls, and the measures needed to keep growth initiatives on track.",
  modules: {
    // ── 3.1 Growth Execution Planning & Priority Setting ──
    priorities: {
      id: "s3-priorities",
      number: "3.1",
      title: "Growth Execution Planning & Priority Setting",
      purpose: "Translate the agreed commercial goals into an execution plan with priorities, sequencing, owners and milestones.",
      guidance: "Strategic priorities agreed; Delivery roadmap by quarter; Dependencies and decision points identified.",
      fields: [
        { id: "s3-priorities-top5", type: "textarea", question: "Top 3–5 Strategic Priorities — List the priorities that will make the biggest difference in the next 90 days." },
        { id: "s3-priorities-qstart", type: "text", question: "Quarter Start Date" },
        { id: "s3-priorities-qend", type: "text", question: "Quarter End Date" },
        { id: "s3-priorities-deps", type: "textarea", question: "Key Dependencies & Decision Points — What must be resolved or decided before key actions can proceed?" },
      ],
      measures: [
        { id: "s3-priorities-m1", label: "Priorities confirmed against plan (%)" },
        { id: "s3-priorities-m2", label: "Milestones achieved on time (%)" },
        { id: "s3-priorities-m3", label: "Blocked actions unresolved (count)" },
      ],
    },

    // ── 3.2 90-Day Action Plans & Milestone Control ──
    ninetyDay: {
      id: "s3-90day",
      number: "3.2",
      title: "90-Day Action Plans & Milestone Control",
      purpose: "Create a rolling 90-day plan for each quarter with actions, expected outcomes, due dates and ownership.",
      guidance: "Quarterly action plan; Milestone tracker; Action status by owner.",
      workstreams: [
        {
          id: "revenue",
          label: "Revenue Growth",
          icon: "💰",
          purpose: "Target accounts agreed, pipeline actions prioritised, stalled deals reviewed, pricing or proposal controls improved.",
          successEvidence: "Pipeline quality improves, win plans are visible, forecast confidence strengthens.",
        },
        {
          id: "marketing",
          label: "Marketing",
          icon: "📣",
          purpose: "Campaign calendar agreed, target messages refined, forecast outcomes approved, review dates set.",
          successEvidence: "Campaigns launch on time, lead quality improves, contribution to pipeline is measurable.",
        },
        {
          id: "crm",
          label: "CRM & Reporting",
          icon: "📋",
          purpose: "Mandatory fields enforced, dashboards live, stage ageing visible, reasons for loss standardised.",
          successEvidence: "Data hygiene improves, managers rely on live reporting, board reporting is consistent.",
        },
        {
          id: "people",
          label: "People",
          icon: "👥",
          purpose: "Coaching schedule active, role expectations clear, capability gaps identified, induction content updated.",
          successEvidence: "Coaching completion rises, consistency improves, performance variation reduces.",
        },
        {
          id: "proposition",
          label: "Value Proposition",
          icon: "🎯",
          purpose: "Value messages tightened, product gaps prioritised, commercial feedback loop established.",
          successEvidence: "Sales conversations become clearer, objections reduce, roadmap decisions are evidence-based.",
        },
      ],
      measures: [
        { id: "s3-90day-m1", label: "90-day actions completed (%)" },
        { id: "s3-90day-m2", label: "On-time delivery (%)" },
        { id: "s3-90day-m3", label: "Actions slipped >14 days (count)" },
      ],
    },

    // ── 3.3 Functional Accountability & Operating Model ──
    accountability: {
      id: "s3-accountability",
      number: "3.3",
      title: "Functional Accountability & Operating Model",
      purpose: "Define what each function must deliver to support revenue growth and organisational readiness.",
      guidance: "RACI-style accountability matrix; Role expectations; Cross-functional operating model.",
      accountabilityRoles: [
        { function: "Board / Investors", accountabilities: "Set growth expectations, approve major investments, challenge performance, support decisions on risk and resource.", evidence: "Quarterly review, action challenge, approval records." },
        { function: "CEO / MD", accountabilities: "Own delivery of the growth plan, align functions, remove blockers, hold leaders accountable.", evidence: "Weekly operating review, action closure, prioritisation decisions." },
        { function: "Sales Leadership", accountabilities: "Drive pipeline performance, deal inspection, coaching and forecasting discipline.", evidence: "Forecast accuracy, coaching logs, stage compliance." },
        { function: "Marketing", accountabilities: "Run target campaigns, forecast contribution, review outcomes and adapt investment choices.", evidence: "Campaign forecast vs actual, source quality, ROI reporting." },
        { function: "Customer Success", accountabilities: "Protect renewals, identify expansion opportunities, improve customer value delivery.", evidence: "Renewal rate, upsell pipeline, customer risk actions." },
        { function: "Product / Solution", accountabilities: "Prioritise market-led improvements, support proposition clarity, remove product barriers to sale.", evidence: "Roadmap decisions linked to commercial evidence." },
        { function: "Finance / RevOps", accountabilities: "Maintain reporting discipline, data quality, KPI dashboards and commercial analysis.", evidence: "Dashboards live, variance analysis, data control." },
        { function: "People / HR", accountabilities: "Support role clarity, hiring, onboarding, capability reviews and succession planning.", evidence: "Skills plans, hiring progress, retention and readiness metrics." },
      ],
      measures: [
        { id: "s3-accountability-m1", label: "Ownership accepted (%)" },
        { id: "s3-accountability-m2", label: "Cross-functional actions completed (%)" },
        { id: "s3-accountability-m3", label: "Escalations due to unclear ownership (count)" },
      ],
    },

    // ── 3.4 Resource, Risk & Dependency Management ──
    risk: {
      id: "s3-risk",
      number: "3.4",
      title: "Resource, Risk & Dependency Management",
      purpose: "Track the people, technology, budget and process constraints that could slow delivery or reduce impact.",
      guidance: "Risk register; Dependency map; Resource requirement log.",
      fields: [
        { id: "s3-risk-resources", type: "textarea", question: "Resource Gaps — Describe any resource gaps (people, technology, budget) that could constrain delivery." },
      ],
      measures: [
        { id: "s3-risk-m1", label: "Critical risks open (count)" },
        { id: "s3-risk-m2", label: "Resource gaps against plan" },
      ],
    },

    // ── 3.5 Board, Leadership & Decision Governance ──
    governance: {
      id: "s3-governance",
      number: "3.5",
      title: "Board, Leadership & Decision Governance",
      purpose: "Set decision rights and review standards so issues are surfaced early and corrected quickly.",
      guidance: "Governance calendar; Decision rights framework; Board reporting format.",
      governanceCalendar: [
        { reviewType: "Weekly Revenue Review", frequency: "Weekly" },
        { reviewType: "Monthly Business Review", frequency: "Monthly" },
        { reviewType: "Quarterly Growth Review", frequency: "Quarterly" },
        { reviewType: "Annual Value Creation Review", frequency: "Annual" },
      ],
      fields: [
        { id: "s3-governance-rights", type: "textarea", question: "Decision Rights Framework — Who has authority to approve investments, change priorities, escalate issues and halt delivery?" },
        { id: "s3-governance-agenda", type: "textarea", question: "Weekly Operating Agenda — Outline the standard weekly revenue review agenda." },
      ],
    },

    // ── 3.6 KPI Dashboard, Action Thresholds & Intervention Rules ──
    kpiDashboard: {
      id: "s3-kpi-dashboard",
      number: "3.6",
      title: "KPI Dashboard, Action Thresholds & Intervention Rules",
      purpose: "Turn scorecard data into action by defining thresholds and intervention triggers before targets are missed.",
      guidance: "Dashboard with tolerances; RAG thresholds; Intervention rules.",
      interventionAreas: [
        { area: "Revenue", amberTrigger: "Below plan but recoverable within current quarter.", typicalIntervention: "Reprioritise activity, increase deal inspection, refine campaign focus." },
        { area: "Pipeline Quality", amberTrigger: "Coverage or stage quality starts to weaken.", typicalIntervention: "Clean pipeline, requalify deals, strengthen manager reviews." },
        { area: "Marketing Contribution", amberTrigger: "Campaign results below predicted range.", typicalIntervention: "Change message, segment, channel mix or budget allocation." },
        { area: "Forecast Accuracy", amberTrigger: "Forecast confidence falls or movement is unexplained.", typicalIntervention: "Increase forecast challenge, review stage discipline, check CRM hygiene." },
        { area: "People / Capability", amberTrigger: "Performance gap persists or coaching is not happening.", typicalIntervention: "Targeted support plan, manager intervention, role reset if needed." },
        { area: "Delivery Milestones", amberTrigger: "Critical actions miss dates or dependencies remain unresolved.", typicalIntervention: "Escalate decision, reallocate resources, adjust scope or sequence." },
      ],
    },

    // ── 3.7 Quarterly Reset & Annual Value Creation Review ──
    reset: {
      id: "s3-reset",
      number: "3.7",
      title: "Quarterly Reset & Annual Value Creation Review",
      purpose: "Refresh priorities, resourcing and targets based on delivery evidence, market change and board objectives.",
      guidance: "Quarterly reset summary; Annual value creation plan; Lessons learned log.",
      fields: [
        { id: "s3-reset-summary", type: "textarea", question: "Quarterly Reset Summary — Summarise the key outcomes from the quarter and what needs to change." },
        { id: "s3-reset-lessons", type: "textarea", question: "Lessons Learned — What worked well and what will be done differently next quarter?" },
        { id: "s3-reset-annual", type: "textarea", question: "Annual Value Creation Plan — What must the business achieve this year to create strategic value beyond revenue?" },
      ],
      measures: [
        { id: "s3-reset-m1", label: "Quarter-on-quarter improvement (%)" },
        { id: "s3-reset-m2", label: "Annual goal attainment (%)" },
        { id: "s3-reset-m3", label: "Value creation actions completed (%)" },
      ],
    },
  },
  challengeQuestions: [
    "Which three to five priorities will make the biggest difference in the next 90 days, and what evidence will prove progress?",
    "Does every workstream have one accountable owner, and are support roles and decision rights fully clear?",
    "Which metrics tell us early that delivery is slipping, and what intervention will be triggered when thresholds are crossed?",
    "How well are sales, marketing, product, customer success and finance working from one shared growth plan rather than separate agendas?",
    "What should the board expect to see each month and quarter to have confidence that the plan is being delivered?",
  ],
} as const;
