export type ProjectCategory = "BIM Production" | "BIM Coordination & Management";

export type Project = {
  id: string;
  number: string;
  title: string;
  year: string;
  category: ProjectCategory;
  type: string;
  role?: string;
  location?: string;
  tools: string[];
  description: string;
  concept: string;
  keyOutputs: string[];
  image?: string;
  gallery?: string[];
  featured?: boolean;
};

export type Experience = {
  company: string;
  position: string;
  period: string;
  location: string;
  summary: string;
};

const media = (file: string) => `/portfolio/${file}`;

export const projects: Project[] = [
  {
    id: "revit-template",
    number: "01",
    title: "Revit Template",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Standard / BIM Production Setup",
    role: "BIM Production / Template Development",
    tools: ["Revit", "BIM360 Docs", "Revit Server", "ACC"],
    description: "Standardized Revit template setup for BIM production, drawing documentation, symbols, sheets, materials, and workflow consistency.",
    concept: "Develop and implement Revit templates to standardize BIM production workflows, drawing setup, sheets, symbols, view settings, material patterns, and documentation standards.",
    keyOutputs: ["Revit template setup", "Architecture and structure template standards", "View and sheet organization", "Material pattern setup", "Symbol and annotation setup", "Drawing production standardization"],
    image: media("image2.png"),
    gallery: [media("image2.png")],
  },
  {
    id: "stair-model-drawing",
    number: "02",
    title: "3D Model & 2D Drawing: Stair",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Modeling / Shop Drawing",
    role: "BIM Modeler / Shop Drawing Production",
    tools: ["Revit", "Navisworks"],
    description: "Detailed stair BIM model and coordinated 2D drawing package for construction documentation and shop drawing submission.",
    concept: "Produce detailed 3D BIM stair models and coordinated 2D drawings to support construction documentation, coordination, and shop drawing submission.",
    keyOutputs: ["Stair 3D model", "Stair plans", "Sections", "Construction details", "Isometric views", "Shop drawing package"],
    image: media("image4.jpeg"),
    gallery: [media("image4.jpeg"), media("image3.jpeg"), media("image6.jpeg"), media("image5.jpeg")],
  },
  {
    id: "auditorium-model-drawing",
    number: "03",
    title: "3D Model & 2D Drawing: Auditorium",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Modeling / Shop Drawing",
    role: "BIM Modeler / Drawing Production",
    tools: ["Revit", "Navisworks"],
    description: "Auditorium BIM modeling and documentation focusing on complex architectural and structural coordination.",
    concept: "Develop 3D BIM elements and detailed 2D documentation for auditorium-related architectural and structural components, focusing on coordination and constructability.",
    keyOutputs: ["Auditorium 3D model", "Construction details", "Section drawings", "Isometric coordination views", "Shop drawing package"],
    image: media("image8.jpeg"),
    gallery: [media("image8.jpeg"), media("image7.jpeg")],
  },
  {
    id: "roof-crown",
    number: "04",
    title: "3D Model & 2D Drawing: Roof Crown",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Modeling / Complex Geometry Documentation",
    role: "BIM Modeler / Technical Documentation",
    tools: ["Revit", "Navisworks"],
    description: "Complex roof crown BIM model and drawing package for structural framing, assembly logic, and construction coordination.",
    concept: "Model and document complex roof crown geometry for construction coordination, including 3D visualization, structural framing, assembly logic, and detailed drawings.",
    keyOutputs: ["Roof crown 3D model", "Structural frame model", "Assembly drawings", "Detail drawings", "Isometric views", "Construction coordination drawings"],
    image: media("image10.png"),
    gallery: [media("image10.png"), media("image9.png"), media("image12.png"), media("image11.png"), media("image14.png"), media("image13.png")],
  },
  {
    id: "roof-machine-room",
    number: "05",
    title: "3D Model & 2D Drawing: Roof Machine Room",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Modeling / Technical Documentation",
    role: "BIM Modeler / Shop Drawing Production",
    tools: ["Revit", "Navisworks"],
    description: "Roof machine room BIM model and drawing documentation for multidisciplinary coordination and construction submission.",
    concept: "Produce roof machine room BIM model and drawing documentation to support multidisciplinary coordination, technical review, and construction drawing submission.",
    keyOutputs: ["Roof machine room 3D model", "Floor plans", "Sections", "Schedules", "Coordination views", "Shop drawings"],
    image: media("image16.png"),
    gallery: [media("image16.png"), media("image15.png"), media("image18.png"), media("image17.png")],
  },
  {
    id: "pavilion",
    number: "06",
    title: "3D Model & 2D Drawing: Pavilion",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Modeling / Shop Drawing / Quantity Support",
    role: "BIM Modeler / Shop Drawing Production",
    tools: ["Revit", "Navisworks"],
    description: "Pavilion BIM model and drawing package with framing, architectural components, structural layout, and material takeoff support.",
    concept: "Develop pavilion BIM model and 2D drawing package with detailed framing, architectural components, structural layout, and material takeoff support.",
    keyOutputs: ["Pavilion 3D model", "Plans", "Elevations", "Sections", "Detail drawings", "Material schedule", "Quantity-related model views"],
    image: media("image20.png"),
    gallery: [media("image20.png"), media("image24.png"), media("image19.png"), media("image23.png"), media("image22.png"), media("image21.png"), media("image26.png"), media("image25.png"), media("image27.png"), media("image28.png")],
  },
  {
    id: "family-lamp-gym",
    number: "07",
    title: "Family Creation: Lamp & Gym Equipment",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Family Creation / Object Library",
    role: "BIM Family Creator",
    tools: ["Revit"],
    description: "BIM family creation for decorative lighting and gym equipment with geometry and specification information.",
    concept: "Create BIM families for decorative lighting and gym equipment with geometry and specification information to support design coordination, visualization, and data-driven schedules.",
    keyOutputs: ["Revit lamp families", "Revit gym equipment families", "Object geometry", "Specification data", "Model-based equipment layout"],
    image: media("image34.png"),
    gallery: [media("image34.png"), media("image33.png"), media("image29.png"), media("image32.png"), media("image31.png"), media("image35.png"), media("image30.png")],
  },
  {
    id: "family-ceiling-louver",
    number: "08",
    title: "Family Creation: Ceiling Tile, Framing & Louvers Panel",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Family Creation / Material & Component System",
    role: "BIM Family Creator",
    tools: ["Revit"],
    description: "BIM families for ceiling tiles, framing, and louver panels with material and specification information.",
    concept: "Develop BIM families and component systems for ceiling tiles, framing, and louver panels, including material options and specification information for design and construction coordination.",
    keyOutputs: ["Ceiling tile family", "Framing family", "Louver panel family", "Material options", "Specification information", "Component detail visualization"],
    image: media("image37.png"),
    gallery: [media("image37.png"), media("image36.png"), media("image39.png"), media("image38.png")],
  },
  {
    id: "family-composite-panel",
    number: "09",
    title: "Family Creation: Composite Panel",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Family Creation / Facade Component",
    role: "BIM Family Creator",
    tools: ["Revit"],
    description: "Composite panel BIM families with assembly logic, material options, panel types, and specification data.",
    concept: "Create composite panel BIM families with layered assembly logic, material options, panel types, and specification data for facade or architectural component coordination.",
    keyOutputs: ["Composite panel family", "Panel assembly diagram", "Material swatches", "Type variation", "Specification information"],
    image: media("image41.png"),
    gallery: [media("image41.png"), media("image40.png")],
  },
  {
    id: "family-kitchen-fm",
    number: "10",
    title: "Family Creation & FM Schedule: Kitchen Equipment",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Family Creation / Facility Management Data",
    role: "BIM Family Creator / BIM Data Preparation",
    tools: ["Revit", "Power BI", "Power Query"],
    description: "Kitchen equipment BIM families with FM-related data and schedule information for model-based equipment management.",
    concept: "Create kitchen equipment BIM families with FM-related data and schedules, connecting model information with progress tracking and equipment management.",
    keyOutputs: ["Kitchen equipment families", "FM schedule", "Equipment layout", "Progress tracking dashboard", "Model-based data schedule"],
    image: media("image43.png"),
    gallery: [media("image43.png"), media("image42.png"), media("image45.png"), media("image44.png")],
  },
  {
    id: "boq-support",
    number: "11",
    title: "Schedule & Quantities: BOQ Support",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Quantity Takeoff / BOQ Support",
    role: "BIM QTO / Data Preparation",
    tools: ["Revit", "Navisworks", "Power Query", "Excel", "Dynamo"],
    description: "Model-based quantity takeoff workflow for BOQ backup, schedule extraction, Excel export, and Dynamo-based calculation.",
    concept: "Use BIM models to generate quantity takeoff data and support BOQ production. The workflow focuses on extracting model quantities, organizing takeoff data, and preparing backup information for cost and procurement use.",
    keyOutputs: ["Model-based QTO", "BOQ backup sheets", "Quantity schedules", "Excel export", "Dynamo-based surface area calculation", "Model quantity validation views"],
    image: media("image47.jpg"),
    gallery: [media("image47.jpg"), media("image46.jpg"), media("image49.jpg"), media("image48.jpg"), media("image51.jpg"), media("image50.jpg"), media("image53.jpg"), media("image52.jpg"), media("image55.jpg"), media("image54.png"), media("image56.png")],
    featured: true,
  },
  {
    id: "earth-work",
    number: "12",
    title: "Schedule & Quantities: Earth Work",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Quantity Takeoff / Construction Planning",
    role: "BIM QTO / Construction Planning Support",
    tools: ["Revit", "Navisworks", "Excel"],
    description: "BIM-based earthwork quantity diagrams for excavation, backfill, soil disposal, staging, and construction sequence logic.",
    concept: "Prepare BIM-based earthwork quantity diagrams to clarify excavation, backfill, soil disposal, staging, and construction sequence logic.",
    keyOutputs: ["Earthwork quantity diagram", "Excavation quantity breakdown", "Backfill quantity breakdown", "Soil disposal diagram", "Construction staging visualization"],
    image: media("image58.png"),
    gallery: [media("image58.png"), media("image57.png"), media("image59.png")],
  },
  {
    id: "waterproof",
    number: "13",
    title: "Schedule & Quantities: Waterproof",
    year: "2017-2023",
    category: "BIM Production",
    type: "BIM Quantity Takeoff / Waterproofing Scope",
    role: "BIM QTO / Scope Visualization",
    tools: ["Revit", "Excel"],
    description: "BIM-based waterproofing quantity visualization and floor-by-floor scope review for BOQ preparation.",
    concept: "Use BIM models to visualize and calculate waterproofing scope by floor or area, supporting quantity review and BOQ preparation.",
    keyOutputs: ["Waterproofing area visualization", "Floor-by-floor scope diagram", "Quantity summary", "Material area schedule"],
    image: media("image61.png"),
    gallery: [media("image61.png"), media("image60.png"), media("image64.png"), media("image63.png"), media("image62.png")],
  },
  {
    id: "tracking-model-progress",
    number: "14",
    title: "Tracking Model Progress",
    year: "2023-Present",
    category: "BIM Coordination & Management",
    type: "BIM Management / Progress Dashboard / Weekly Report",
    role: "BIM Coordinator / Dashboard Preparation",
    tools: ["Power BI", "Excel", "Revit", "Navisworks", "ACC"],
    description: "Progress tracking workflow for BIM model status, discipline progress, weekly reports, delay visibility, and action item communication.",
    concept: "Track BIM model progress by overall discipline and individual discipline. Provide progress visibility through dashboards, weekly reports, charts, and discipline-based status summaries.",
    keyOutputs: ["Overall discipline dashboard", "Discipline-specific progress dashboard", "Weekly report", "Progress chart", "Model status tracking", "Delay and action item reporting"],
    image: media("image71.png"),
    gallery: [media("image71.png"), media("image66.png"), media("image70.png"), media("image65.png"), media("image69.png"), media("image68.png"), media("image67.png"), media("image72.png")],
    featured: true,
  },
  {
    id: "clash-issue-reports",
    number: "15",
    title: "Clash and Issue Reports",
    year: "2023-Present",
    category: "BIM Coordination & Management",
    type: "BIM Coordination / Clash Detection / Issue Management",
    role: "BIM Coordinator",
    tools: ["Navisworks", "Revit", "ACC", "BIM360 Docs", "Excel"],
    description: "Clash detection and issue reporting workflow to support design-to-construction transition and pre-construction coordination.",
    concept: "Manage clash and issue reports to support the transition from design stage to construction stage. The workflow focuses on identifying conflicts, tracking coordination status, preparing issue reports, and supporting contractor review during pre-construction and construction coordination.",
    keyOutputs: ["Clash detection report", "Issue tracking log", "Coordination meeting support", "Design-to-construction issue transition", "Pre-construction clash report", "RFI support information"],
    image: media("image74.png"),
    gallery: [media("image74.png"), media("image78.png"), media("image73.png"), media("image77.png"), media("image76.png"), media("image75.png"), media("image85.png"), media("image80.jpeg"), media("image84.png"), media("image79.jpeg"), media("image83.png"), media("image82.jpeg"), media("image81.jpeg"), media("image86.png"), media("image88.png"), media("image92.png"), media("image87.png"), media("image91.png"), media("image90.jpeg"), media("image89.jpeg")],
    featured: true,
  },
];

export const experiences: Experience[] = [
  {
    company: "Freelance",
    position: "BIM Coordinator",
    period: "Nov 2023 - Present",
    location: "Bangkok, Thailand",
    summary: "BIM coordination for design-stage and construction-stage projects, including BEP, CDE, QA/QC, clash checking, weekly BIM reports, and issue reporting.",
  },
  {
    company: "Thai Kajima Co., Ltd. (Contract)",
    position: "BIM Engineer & Modeler",
    period: "Mar 2023 - Oct 2023",
    location: "Rayong, Thailand",
    summary: "Produced coordinated 3D BIM models and shop drawings, supported quantity takeoff, procurement, scheduling, material tracking, and As-Built model planning.",
  },
  {
    company: "Ritta Co., Ltd.",
    position: "Office Engineer (BIM)",
    period: "Jul 2017 - Mar 2023",
    location: "Bangkok, Thailand",
    summary: "Worked on BIM standards, Revit templates, CDE/document control, structural BIM modeling, shop drawings, Power BI progress tracking, BIM QTO, RFIs, and coordination with consultants.",
  },
];

export const skillGroups = [
  {
    title: "BIM Process & Coordination",
    items: ["CDE & Document Control", "BIM Model QA/QC", "Model Validation", "Clash Detection", "Issue Tracking", "Coordination Meeting", "BIM Workflow Coordination", "Multi-discipline Model Coordination"],
  },
  {
    title: "BIM Production",
    items: ["3D Model Production", "2D Shop Drawing", "Revit Template", "BIM Family Creation", "As-Built Model", "Construction Documentation"],
  },
  {
    title: "Technical & Data",
    items: ["Model-based Quantity Takeoff", "BOQ Backup", "Data Preparation", "Data Transformation", "Dashboard and Report Preparation", "Weekly BIM Report"],
  },
  {
    title: "Tools",
    items: ["Revit", "Navisworks", "Power BI", "Power Query", "ACC", "BIM360 Docs", "Revit Server", "Excel", "Dynamo"],
  },
];

export const contact = {
  name: "Nattapong Loes-a-nan",
  nickname: "Mos",
  title: "Office Engineer | BIM Specialist | BIM Coordinator",
  location: "Bangkok, Thailand",
  email: "badtz.mos@gmail.com",
  phone: "0850331812",
  cv: "/files/Nattapong-Loes-a-nan-CV-Portfolio.pdf",
  profileImage: "/images/profile/nattapong-profile.jpg",
};

export const marqueeText = "BIM Production · BIM Coordination · Revit Documentation · Navisworks Clash Detection · Model QA/QC · CDE & Document Control · QTO/BOQ · Power BI Reporting · Dynamo · Construction Coordination · Shop Drawing · As-Built Model";
