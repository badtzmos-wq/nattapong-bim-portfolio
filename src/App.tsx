import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { contact, experiences, projects, publicPath, skillGroups, type Project, type ProjectCategory } from "./data";

const filters: Array<"All" | ProjectCategory> = ["All", "BIM Production", "BIM Coordination & Management"];
type PageName = "home" | "work" | "about" | "contact";
const navItems = [
  { label: "Home", page: "home" as const },
  { label: "Work", page: "work" as const },
  { label: "About", page: "about" as const },
  { label: "Contact", page: "contact" as const },
];
const heroTags = ["BIM Production", "BIM Coordination", "Revit Documentation", "Clash Detection", "QTO/BOQ", "CDE", "Power BI"];
const serviceHighlights = [
  { title: "BIM Production", text: "Models, shop drawings and documentation", mark: "01" },
  { title: "BIM Coordination", text: "Clash detection, issue tracking and meetings", mark: "02" },
  { title: "Revit Documentation", text: "Drawing sets, symbols, families and templates", mark: "03" },
  { title: "CDE & Control", text: "BEP, document control and revision management", mark: "04" },
  { title: "QTO / BOQ", text: "Quantity takeoff, BOQ and cost planning", mark: "05" },
];

const coreTools = [
  { name: "Revit", image: publicPath("/images/tools-real/revit.png") },
  { name: "Navisworks", image: publicPath("/images/tools-real/navisworks.png") },
  { name: "Power BI", image: publicPath("/images/tools-real/power-bi.webp") },
  { name: "Excel", image: publicPath("/images/tools-real/excel.svg") },
  { name: "Power Query", image: publicPath("/images/tools-real/power-query.png") },
  { name: "Autodesk Forma", image: publicPath("/images/tools-real/autodesk-forma.png") },
  { name: "pyRevit", image: publicPath("/images/tools-real/pyrevit.webp") },
];

const proficiencyLevels = [
  { level: "Expert", tools: ["Revit"] },
  { level: "Advanced", tools: ["Navisworks"] },
  { level: "Intermediate", tools: ["Power BI", "Excel", "Power Query", "Autodesk Forma", "Dynamo", "pyRevit"] },
];

const linkedInUrl = "https://www.linkedin.com/in/nattapong-loes-a-nan-5245a6140/";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function getPageFromHash(): PageName {
  const page = window.location.hash.replace("#", "") as PageName;
  return ["home", "work", "about", "contact"].includes(page) ? page : "home";
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageName>(() => getPageFromHash());
  const [activeFilter, setActiveFilter] = useState<"All" | ProjectCategory>("All");
  const [query, setQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [footerInView, setFooterInView] = useState(false);

  const featuredProjects = useMemo(() => {
    const featuredOrder = ["tracking-model-progress", "clash-issue-reports", "boq-support"];
    return featuredOrder.map((id) => projects.find((project) => project.id === id)).filter(Boolean) as Project[];
  }, []);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesFilter = activeFilter === "All" || project.category === activeFilter;
      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      const searchable = [
        project.number,
        project.title,
        project.year,
        project.category,
        project.type,
        project.role,
        project.location,
        project.description,
        project.concept,
        ...project.tools,
        ...project.keyOutputs,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [activeFilter, query]);

  useEffect(() => {
    const onScroll = () => {
      const footer = document.querySelector(".site-footer");
      const footerRect = footer?.getBoundingClientRect();
      const footerZone = footerInView || (footerRect ? footerRect.top < window.innerHeight - 24 : false);
      setShowBackToTop(window.scrollY > 640 && !footerZone);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [currentPage, footerInView]);

  useEffect(() => {
    setFooterInView(false);
    const footer = document.querySelector(".site-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterInView(entry.isIntersecting);
        if (entry.isIntersecting) setShowBackToTop(false);
      },
      { rootMargin: "0px 0px 96px 0px", threshold: 0 },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [currentPage]);

  useEffect(() => {
    const onHashChange = () => {
      setCurrentPage(getPageFromHash());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    if (!window.location.hash) window.history.replaceState(null, "", "#home");
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedProject ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProject]);

  useEffect(() => {
    const openProject = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      const project = projects.find((item) => item.id === id);
      if (project) setSelectedProject(project);
    };
    window.addEventListener("open-project", openProject);
    return () => window.removeEventListener("open-project", openProject);
  }, []);

  const navigateTo = (page: PageName) => {
    if (window.location.hash === `#${page}`) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = page;
    }
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-site text-primary">
      <Navbar currentPage={currentPage} menuOpen={menuOpen} onNavigate={navigateTo} setMenuOpen={setMenuOpen} />

      <main id="top">
        <AnimatePresence mode="wait">
          {currentPage === "home" ? (
            <PageFrame key="home">
              <HomePage featuredProjects={featuredProjects} onNavigate={navigateTo} onSelect={setSelectedProject} />
            </PageFrame>
          ) : null}
          {currentPage === "work" ? (
            <PageFrame key="work">
              <WorkPage
                activeFilter={activeFilter}
                featuredProjects={featuredProjects}
                filteredProjects={filteredProjects}
                query={query}
                totalProjects={projects.length}
                onFilter={setActiveFilter}
                onQuery={setQuery}
                onSelect={setSelectedProject}
              />
            </PageFrame>
          ) : null}
          {currentPage === "about" ? (
            <PageFrame key="about">
              <AboutPage />
            </PageFrame>
          ) : null}
          {currentPage === "contact" ? (
            <PageFrame key="contact">
              <ContactPage onNavigate={navigateTo} />
            </PageFrame>
          ) : null}
        </AnimatePresence>
      </main>

      {currentPage !== "contact" ? <Footer currentPage={currentPage} onNavigate={navigateTo} /> : null}
      <BackToTopButton visible={showBackToTop} />
      <AnimatePresence>{selectedProject ? <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} onSelectProject={setSelectedProject} /> : null}</AnimatePresence>
    </div>
  );
}

function Navbar({
  currentPage,
  menuOpen,
  onNavigate,
  setMenuOpen,
}: {
  currentPage: PageName;
  menuOpen: boolean;
  onNavigate: (page: PageName) => void;
  setMenuOpen: (open: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-site/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 md:px-8 lg:px-12" aria-label="Primary navigation">
        <button className="brand-button" type="button" onClick={() => onNavigate("home")}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#111111] text-sm font-bold text-white">NL</span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-[0.16em]">NATTAPONG</span>
            <span className="block text-xs text-secondary">BIM Portfolio</span>
          </span>
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <button className={`nav-link ${currentPage === item.page ? "is-active" : ""}`} type="button" onClick={() => onNavigate(item.page)} key={item.page}>
              {item.label}
            </button>
          ))}
          <button className="button-primary nav-cta ml-1" type="button" onClick={() => onNavigate("contact")}>
            Get in Touch
          </button>
        </div>

        <button
          className="hamburger md:hidden"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="border-t border-border bg-white px-5 py-4 md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {navItems.map((item) => (
                <button className={`mobile-link ${currentPage === item.page ? "is-active" : ""}`} type="button" key={item.page} onClick={() => onNavigate(item.page)}>
                  {item.label}
                </button>
              ))}
              <button className="button-primary mt-2 justify-center" type="button" onClick={() => onNavigate("contact")}>
                Get in Touch
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
      {children}
    </motion.div>
  );
}

function HomePage({
  featuredProjects,
  onNavigate,
  onSelect,
}: {
  featuredProjects: Project[];
  onNavigate: (page: PageName) => void;
  onSelect: (project: Project) => void;
}) {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <ServiceStrip />
      <HomeSelectedWork projects={featuredProjects} onNavigate={onNavigate} onSelect={onSelect} />
    </>
  );
}

function Hero({ onNavigate }: { onNavigate: (page: PageName) => void }) {
  return (
    <section className="hero-shell">
      <div className="hero-inner">
        <motion.div className="hero-copy" initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.55 }}>
          <p className="eyebrow">Bangkok, Thailand / BIM Professional</p>
          <h1 className="hero-title">
            <span>Nattapong</span>
            <span>Loes-a-nan</span>
          </h1>
          <p className="hero-role">{contact.title}</p>
          <div className="hero-tagline" aria-label="Core BIM services">
            {heroTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-secondary">
            BIM Engineer with 7+ years of experience across design and construction phases, specializing in BIM production,
            BIM coordination, CDE setup, model QA/QC, clash detection, shop drawings, and model-based QTO/BOQ.
          </p>
          <div className="hero-proof-strip" aria-label="Portfolio highlights">
            <Stat value="7+" label="Years Experience" />
            <Stat value="15" label="Portfolio Projects" />
            <Stat value="2 Phases" label="Design + Construction" />
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button className="button-primary justify-center" type="button" onClick={() => onNavigate("work")}>View Work -&gt;</button>
            <a className="button-secondary justify-center" href={contact.cv} download>Download CV</a>
          </div>
        </motion.div>

        <figure className="hero-evidence" aria-label="BIM model evidence visuals">
          <div className="hero-model hero-model-primary">
            <img src={publicPath("/images/home/3d-per-05-display.png")} alt="3D BIM building model perspective" />
          </div>
          <div className="hero-model hero-model-secondary">
            <img src={publicPath("/images/home/3d-per-01-display.png")} alt="3D BIM coordination model perspective" />
          </div>
        </figure>
      </div>
    </section>
  );
}

function ServiceStrip() {
  return (
    <section className="service-strip" aria-label="Core BIM service areas">
      {serviceHighlights.map((item) => (
        <article className="service-item" key={item.title}>
          <span>{item.mark}</span>
          <div>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function HomeSelectedWork({
  projects,
  onNavigate,
  onSelect,
}: {
  projects: Project[];
  onNavigate: (page: PageName) => void;
  onSelect: (project: Project) => void;
}) {
  return (
    <section className="section-block home-selected">
      <SectionIntro eyebrow="Featured Work" title="Selected BIM Projects" text="A selection of projects highlighting coordination, issue reporting, and model-based quantity workflows." action={<button className="button-secondary" type="button" onClick={() => onNavigate("work")}>View All Projects -&gt;</button>} />
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={{ ...project, number: `0${index + 1}` }} featured onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function WorkPage({
  activeFilter,
  featuredProjects,
  filteredProjects,
  query,
  totalProjects,
  onFilter,
  onQuery,
  onSelect,
}: {
  activeFilter: "All" | ProjectCategory;
  featuredProjects: Project[];
  filteredProjects: Project[];
  query: string;
  totalProjects: number;
  onFilter: (filter: "All" | ProjectCategory) => void;
  onQuery: (query: string) => void;
  onSelect: (project: Project) => void;
}) {
  return (
    <section className="page-shell work-page">
      <div className="page-intro">
        <p className="eyebrow">Work</p>
        <h1>Selected BIM Work</h1>
        <p>A selection of projects showcasing BIM production, coordination, issue reporting, and model-based quantity workflows.</p>
      </div>

      <div className="work-feature-list">
        {featuredProjects.slice(0, 2).map((project, index) => (
          <WorkFeature key={project.id} project={{ ...project, number: `0${index + 1}` }} reverse={index % 2 === 1} onSelect={onSelect} />
        ))}
      </div>

      <ProjectGrid
        activeFilter={activeFilter}
        projects={filteredProjects}
        query={query}
        totalProjects={totalProjects}
        onFilter={onFilter}
        onQuery={onQuery}
        onSelect={onSelect}
      />
    </section>
  );
}

function WorkFeature({ project, reverse, onSelect }: { project: Project; reverse?: boolean; onSelect: (project: Project) => void }) {
  const visibleTools = project.tools.slice(0, 5);
  return (
    <article className={`work-feature ${reverse ? "is-reverse" : ""}`}>
      <button className="work-feature-image" type="button" onClick={() => onSelect(project)} aria-label={`View project details for ${project.title}`}>
        <span className="project-image-canvas">
          {project.image ? <img src={project.image} alt={`${project.title} project preview`} loading="lazy" /> : <Placeholder category={project.category} />}
        </span>
      </button>
      <div className="work-feature-copy">
        <div className="meta">
          <b>{project.number}</b>
          <span>/</span>
          <span>{project.year}</span>
        </div>
        <h2>{project.title}</h2>
        <p className="category">{project.category}</p>
        <p>{project.description}</p>
        <div className="project-tags">
          {visibleTools.map((tool) => (
            <span className="tag" key={tool}>{tool}</span>
          ))}
        </div>
        <button className="view-project" type="button" onClick={() => onSelect(project)}>
          View Project <span aria-hidden="true">-&gt;</span>
        </button>
      </div>
    </article>
  );
}

function ProjectGrid({
  projects: visibleProjects,
  activeFilter,
  query,
  totalProjects,
  onFilter,
  onQuery,
  onSelect,
}: {
  projects: Project[];
  activeFilter: "All" | ProjectCategory;
  query: string;
  totalProjects: number;
  onFilter: (filter: "All" | ProjectCategory) => void;
  onQuery: (query: string) => void;
  onSelect: (project: Project) => void;
}) {
  return (
    <section className="archive-section">
      <SectionIntro eyebrow="All Projects Archive" title="BIM work archive" text="Filter by category or search by project name, tool, output, or workflow keyword." />

      <div className="mt-8 rounded-[2rem] border border-border bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Project category filters">
            {filters.map((filter) => (
              <button className={`filter-button ${activeFilter === filter ? "is-active" : ""}`} type="button" aria-pressed={activeFilter === filter} onClick={() => onFilter(filter)} key={filter}>
                {filter}
              </button>
            ))}
          </div>
          <label className="search-field">
            <span className="sr-only">Search projects</span>
            <input value={query} onChange={(event) => onQuery(event.target.value)} type="search" placeholder="Search by project name, tool, category, or output" />
          </label>
        </div>
        <p className="mt-4 text-sm text-secondary" aria-live="polite">
          Showing {visibleProjects.length} of {totalProjects} projects
        </p>
      </div>

      {visibleProjects.length ? (
        <div className="project-grid-wide mt-8">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="text-xl font-bold">No projects found.</p>
          <button className="button-secondary mt-4" type="button" onClick={() => { onFilter("All"); onQuery(""); }}>
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}

function ProjectCard({ project, featured = false, onSelect }: { project: Project; featured?: boolean; onSelect: (project: Project) => void }) {
  const visibleTools = project.tools.slice(0, featured ? 3 : 4);

  return (
    <article className={`project-card ${featured ? "project-card-featured" : ""}`}>
      <button className="project-image" type="button" onClick={() => onSelect(project)} aria-label={`View project details for ${project.title}`}>
        <span className="project-image-canvas">
          {project.image ? <img src={project.image} alt={`${project.title} project preview`} loading="lazy" /> : <Placeholder category={project.category} />}
        </span>
      </button>
      <div className="project-card-body">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <span className="project-number">{project.number}</span>
          <span className="project-year">{project.year}</span>
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-accent">{project.category}</p>
        <h3 className="project-title">{project.title}</h3>
        <p className="project-description">{project.description}</p>
        <div className="project-tags">
          {visibleTools.map((tool) => (
            <span className="tag" key={tool}>{tool}</span>
          ))}
        </div>
        <button className="view-project" type="button" onClick={() => onSelect(project)}>
          View Project <span aria-hidden="true">-&gt;</span>
        </button>
      </div>
    </article>
  );
}

function ProjectDetail({ project, onClose, onSelectProject }: { project: Project; onClose: () => void; onSelectProject: (project: Project) => void }) {
  const currentIndex = projects.findIndex((item) => item.id === project.id);
  const nextProject = projects[(currentIndex + 1) % projects.length];
  const images = useMemo(
    () => Array.from(new Set([project.image, ...(project.gallery ?? [])].filter(Boolean))) as string[],
    [project],
  );
  const [activeImage, setActiveImage] = useState(images[0] ?? "");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImageIndex = Math.max(0, images.indexOf(activeImage));
  const imagesRef = useRef(images);
  const lightboxOpenRef = useRef(lightboxOpen);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    lightboxOpenRef.current = lightboxOpen;
  }, [lightboxOpen]);

  useEffect(() => {
    setActiveImage(images[0] ?? "");
    setLightboxOpen(false);
  }, [images]);

  useEffect(() => {
    const content = document.querySelector(".detail-content");
    content?.scrollTo({ top: 0, behavior: "auto" });
  }, [project.id]);

  const showPreviousImage = () => {
    setActiveImage((currentImage) => {
      if (!images.length) return currentImage;
      const currentIndex = Math.max(0, images.indexOf(currentImage));
      return images[(currentIndex - 1 + images.length) % images.length];
    });
  };

  const showNextImage = () => {
    setActiveImage((currentImage) => {
      if (!images.length) return currentImage;
      const currentIndex = Math.max(0, images.indexOf(currentImage));
      return images[(currentIndex + 1) % images.length];
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (lightboxOpenRef.current) {
          event.stopPropagation();
          setLightboxOpen(false);
          return;
        }
        onClose();
      }

      if (lightboxOpenRef.current && event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveImage((currentImage) => {
          const currentImages = imagesRef.current;
          if (!currentImages.length) return currentImage;
          const currentIndex = Math.max(0, currentImages.indexOf(currentImage));
          return currentImages[(currentIndex - 1 + currentImages.length) % currentImages.length];
        });
      }

      if (lightboxOpenRef.current && event.key === "ArrowRight") {
        event.preventDefault();
        setActiveImage((currentImage) => {
          const currentImages = imagesRef.current;
          if (!currentImages.length) return currentImage;
          const currentIndex = Math.max(0, currentImages.indexOf(currentImage));
          return currentImages[(currentIndex + 1) % currentImages.length];
        });
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <motion.div className="detail-overlay" role="dialog" aria-modal="true" aria-labelledby="project-detail-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button className="detail-scrim" type="button" aria-label="Close project detail" onClick={onClose} />
      <motion.article className="detail-panel" initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 48, opacity: 0 }} transition={{ duration: 0.25 }}>
        <button className="detail-close-icon" type="button" aria-label="Close project detail" onClick={onClose}>
          <span aria-hidden="true">x</span>
        </button>
        <div className="detail-hero">
          {activeImage ? (
            <>
              <img className="detail-preview-image" src={activeImage} alt={`${project.title} selected project visual`} />
              <button className="view-full-image" type="button" onClick={() => setLightboxOpen(true)}>
                View full image
              </button>
            </>
          ) : (
            <Placeholder category={project.category} />
          )}
        </div>
        <div className="detail-content">
          <div className="flex items-center justify-between gap-4">
            <p className="project-number">{project.number} /</p>
            <button className="close-button" type="button" onClick={onClose}>Close</button>
          </div>
          <h2 id="project-detail-title">{project.title}</h2>

          <dl className="metadata-grid">
            <Meta label="Year" value={project.year} />
            <Meta label="Category" value={project.category} />
            <Meta label="Type" value={project.type} />
            <Meta label="Role" value={project.role || "BIM Support"} />
            <Meta label="Location" value={project.location || "Bangkok / Thailand project support"} />
            <Meta label="Tools" value={project.tools.join(" / ")} />
          </dl>

          <section className="detail-section">
            <h3>Project Overview</h3>
            <p>{project.concept}</p>
          </section>

          <section className="detail-section">
            <h3>Key Outputs</h3>
            <ul className="output-list">
              {project.keyOutputs.map((output) => (
                <li key={output}>{output}</li>
              ))}
            </ul>
          </section>

          <section className="detail-section">
            <h3>Tools & Workflow</h3>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <span className="tag tag-strong" key={tool}>{tool}</span>
              ))}
            </div>
          </section>

          {images.length ? (
            <section className="detail-section">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3>Visual gallery</h3>
                  <p className="gallery-help">Select an image to preview it larger.</p>
                </div>
                <p className="gallery-count">
                  {activeImageIndex + 1} / {images.length}
                </p>
              </div>
              <div className="detail-gallery">
                {images.map((image, index) => (
                  <button
                    className={`gallery-thumb ${activeImage === image ? "is-active" : ""}`}
                    key={image}
                    type="button"
                    aria-label={`Preview ${project.title} visual ${index + 1}`}
                    aria-pressed={activeImage === image}
                    onClick={() => setActiveImage(image)}
                  >
                    <img src={image} alt={`${project.title} visual ${index + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className="detail-actions">
            <button className="button-secondary" type="button" onClick={onClose}>
              &lt;- All Projects
            </button>
            <button className="button-primary" type="button" onClick={() => onSelectProject(nextProject)}>
              Next Project -&gt;
            </button>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {lightboxOpen && activeImage ? (
          <motion.div
            className="lightbox-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} full image viewer`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button className="lightbox-scrim" type="button" aria-label="Close full image viewer" onClick={() => setLightboxOpen(false)} />
            <motion.div
              className="lightbox-panel"
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="lightbox-topbar">
                <div>
                  <p className="project-number">{project.number} / {activeImageIndex + 1}</p>
                  <p className="lightbox-title">{project.title}</p>
                </div>
                <button className="lightbox-close" type="button" onClick={() => setLightboxOpen(false)}>
                  Close
                </button>
              </div>
              <div className="lightbox-image-wrap">
                <span className="lightbox-image-canvas">
                  <img className="lightbox-image" src={activeImage} alt={`${project.title} full-size visual ${activeImageIndex + 1}`} />
                </span>
              </div>
              {images.length > 1 ? (
                <div className="lightbox-nav">
                  <button type="button" aria-label="Previous image" onClick={showPreviousImage}>
                    Previous
                  </button>
                  <span>
                    {activeImageIndex + 1} / {images.length}
                  </span>
                  <button type="button" aria-label="Next image" onClick={showNextImage}>
                    Next
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function AboutPage() {
  return (
    <section className="cv-page">
      <div className="cv-main">
        <div className="cv-hero">
          <div>
            <p className="eyebrow">About / CV</p>
            <h1>Nattapong<br />Loes-a-nan</h1>
            <p className="cv-role">{contact.title}</p>
            <p>
              BIM Engineer with 7+ years of experience across design and construction phases. I specialize in BIM production,
              coordination, CDE setup, model QA/QC, clash detection, shop drawings, and model-based QTO/BOQ to support efficient project delivery.
            </p>
            <blockquote>I connect people, models, and data to deliver coordinated BIM solutions that support better decisions on site.</blockquote>
          </div>
          <figure className="cv-portrait">
            <img src={contact.profileImage} alt="Nattapong Loes-a-nan profile portrait" loading="lazy" />
          </figure>
        </div>

        <div className="cv-columns">
          <section className="cv-col">
            <NumberHead number="01" title="Experience" />
            <div className="cv-experience-list">
              {experiences.map((experience) => (
                <article className="cv-experience" key={`${experience.company}-${experience.period}`}>
                  <time>{experience.period}</time>
                  <div>
                    <h2>{experience.position}</h2>
                    <p className="company">{experience.company} / {experience.location}</p>
                    <p>{experience.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="cv-col">
            <NumberHead number="02" title="Skills & Tools" />
            {skillGroups.slice(0, 3).map((group) => (
              <div className="tool-group" key={group.title}>
                <h3>{group.title.replace("BIM Process & Coordination", "BIM Coordination")}</h3>
                <div className="chips">
                  {group.items.slice(0, 5).map((item) => (
                    <span className="chip" key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="cv-col">
            <NumberHead number="03" title="BIM Process & Coordination" />
            <div className="process-list">
              {[
                ["Project Setup", "Review BEP, information exchange requirement, folder structure, and CDE workflow."],
                ["Model Coordination", "Coordinate disciplines, run clash detection, and manage issues through structured workflows."],
                ["Quality & Validation", "Perform model QA/QC, quantity validation, and data accuracy checks."],
                ["Reporting & Delivery", "Create weekly reports, dashboards, QTO/BOQ, and coordinated outputs."],
              ].map(([title, text], index) => (
                <article className="process-item" key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="proficiency-panel" aria-label="Software proficiency">
            <h2>Software Proficiency</h2>
            <div className="proficiency-list">
              {proficiencyLevels.map((item) => (
                <div className="proficiency-row" key={item.level}>
                  <strong>{item.level}</strong>
                  <span className="proficiency-tools">
                    {item.tools.map((tool) => (
                      <span className="proficiency-chip" key={tool}>{tool}</span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <aside className="cv-sidebar">
        <SideCard title="Contact">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={`tel:${contact.phone}`}>{contact.phone}</a>
          <a href={linkedInUrl} target="_blank" rel="noreferrer">LinkedIn Profile</a>
        </SideCard>
        <SideCard title="Location">
          <strong>{contact.location}</strong>
          <span>Available for projects nationwide</span>
        </SideCard>
        <SideCard title="Core Tools">
          <div className="tool-icons">
            {coreTools.map((tool) => (
              <span className="tool-pill" key={tool.name}>
                <img className="tool-logo" src={tool.image} alt="" />
                {tool.name}
              </span>
            ))}
          </div>
        </SideCard>
        <SideCard title="Credentials / Focus">
          {["BIM Production & Documentation", "BIM Coordination & Clash Management", "Model QA/QC & Validation", "QTO/BOQ & Quantity Takeoff", "CDE & Document Control"].map((item) => (
            <span className="check-line" key={item}>✓ {item}</span>
          ))}
        </SideCard>
      </aside>
    </section>
  );
}

function NumberHead({ number, title }: { number: string; title: string }) {
  return (
    <div className="number-head">
      <span>{number}</span>
      <h2>{title}</h2>
    </div>
  );
}

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="side-card">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function ContactPage({ onNavigate }: { onNavigate: (page: PageName) => void }) {
  return (
    <section className="contact-page">
      <main className="contact-main">
        <section>
          <p className="eyebrow">Contact</p>
          <h1>Let's<br />connect.</h1>
          <p>For BIM coordination, BIM production, model QA/QC, quantity takeoff, or portfolio discussion.</p>
          <div className="contact-actions">
            <a className="button-primary" href={`mailto:${contact.email}`}>Email Me</a>
            <a className="button-secondary" href={contact.cv} download>Download CV</a>
            <button className="button-secondary" type="button" onClick={() => onNavigate("work")}>View Work</button>
          </div>
        </section>
        <aside>
          <ContactMethod icon="email" label="Email" value={contact.email} href={`mailto:${contact.email}`} />
          <ContactMethod icon="phone" label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
          <ContactMethod icon="location" label="Based" value={contact.location} note="Available for projects nationwide" />
          <div className="opportunity-card">
            <span aria-hidden="true"><ContactIcon icon="opportunity" /></span>
            <div>
              <h2>Open to new opportunities</h2>
              <p>Freelance or full-time roles in BIM coordination, BIM production, CDE management, and project support.</p>
            </div>
          </div>
        </aside>
      </main>
      <Footer currentPage="contact" onNavigate={onNavigate} />
    </section>
  );
}

function ContactMethod({ icon, label, value, href, note }: { icon: "email" | "phone" | "location"; label: string; value: string; href?: string; note?: string }) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </>
  );
  return (
    <div className="contact-method">
      <div className="round-icon" aria-hidden="true"><ContactIcon icon={icon} /></div>
      <div>{href ? <a href={href}>{content}</a> : content}</div>
    </div>
  );
}

function ContactIcon({ icon }: { icon: "email" | "phone" | "location" | "opportunity" }) {
  if (icon === "email") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }
  if (icon === "phone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.5 5.5 6 8c1.2 4.8 4.2 7.8 10 10l2.5-2.5-3.2-3.2-1.8 1.8c-1.9-.9-3.4-2.4-4.5-4.5l1.8-1.8z" />
      </svg>
    );
  }
  if (icon === "location") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
        <path d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3.5 20c.7-3 2.8-4.5 6.5-4.5S15.8 17 16.5 20M13.5 19.5c.5-2.3 2.2-3.5 5-3.5 1 0 1.8.1 2.5.4" />
    </svg>
  );
}

function Footer({ currentPage, onNavigate }: { currentPage: PageName; onNavigate: (page: PageName) => void }) {
  return (
    <footer className="site-footer">
      <p>© 2026 Nattapong Loes-a-nan. All rights reserved.</p>
      <div>
        <a href={linkedInUrl} target="_blank" rel="noreferrer">LinkedIn</a>
        <span>•</span>
        <a href={`mailto:${contact.email}`} aria-label="Email Nattapong">Email</a>
      </div>
      <p>
        Bangkok, Thailand <span>|</span>{" "}
        <button type="button" onClick={() => (currentPage === "home" ? window.scrollTo({ top: 0, behavior: "smooth" }) : onNavigate("home"))}>Back to top ↑</button>
      </p>
    </footer>
  );
}

function BackToTopButton({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
          Top
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

function SectionIntro({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="section-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        <p className="section-description">{text}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Placeholder({ category }: { category: ProjectCategory }) {
  return (
    <div className="placeholder">
      <span>{category}</span>
      <strong>Image coming soon</strong>
    </div>
  );
}

