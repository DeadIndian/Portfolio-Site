import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import resume from "../../../resumeData.json";
import { projects } from "@/data/portfolio";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Golla Bharath - Resume",
  description:
    "Software engineering, infrastructure, open source, and community leadership experience of Golla Bharath.",
  alternates: { canonical: "/resume" },
};

export default function ResumePage() {
  return (
    <main className="resume-page">
      <nav className="resume-actions" aria-label="Resume actions">
        <Link href="/" className="text-link">
          <ArrowLeft size={16} />
          Back to portfolio
        </Link>
        <PrintButton />
      </nav>
      <article className="resume-sheet">
        <header>
          <span className="eyebrow">
            SOFTWARE / INFRASTRUCTURE / OPEN SOURCE
          </span>
          <h1>
            Golla Bharath<span className="accent">.</span>
          </h1>
          <p>Hyderabad, India</p>
          <div className="resume-contact">
            <a href={`mailto:${resume.personalInfo.email}`}>
              {resume.personalInfo.email}
            </a>
            <a href="https://github.com/DeadIndian">github.com/DeadIndian</a>
            <a href="https://linkedin.com/in/golla-bharath">
              linkedin.com/in/golla-bharath
            </a>
          </div>
        </header>
        <section>
          <h2>Profile</h2>
          <p>{resume.professionalSummary.default}</p>
        </section>
        <section>
          <h2>Experience</h2>
          <h3>
            CyberParadigm <span>Software / Infrastructure Intern</span>
          </h3>
          <p className="resume-date">September 2025 - Present</p>
          <ul>
            {resume.experience[0].bullets
              .filter((_, i) => [0, 2, 3, 4, 6, 7, 8].includes(i))
              .map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
          </ul>
          <h3>
            Recurse, KMIT <span>Club Head</span>
          </h3>
          <p className="resume-date">August 2026 - Present</p>
          <p>
            Lead workshops, hackathons and peer-learning sessions; mentor
            juniors in software development and open source.
          </p>
          <h3>
            Gamify <span>Former Lead Maintainer</span>
          </h3>
          <p className="resume-date">
            From July 2025 / Repository now archived
          </p>
          <p>
            Reviewed code and coordinated community contributions to an
            open-source rewards and gamification platform.
          </p>
        </section>
        <section>
          <h2>Selected Work</h2>
          {projects
            .filter((project) =>
              [
                "adb",
                "transitops",
                "tailscale-widget",
                "calico-grafana",
              ].includes(project.id),
            )
            .map((project) => (
              <div className="resume-project" key={project.id}>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <p className="resume-stack">{project.stack.join(" / ")}</p>
                <a href={project.repo}>
                  {project.repo.replace("https://", "")}
                </a>
              </div>
            ))}
        </section>
        <section>
          <h2>Skills</h2>
          {Object.entries(resume.skillsDisplay).map(([group, skills]) => (
            <p key={group}>
              <strong>{group}: </strong>
              {skills.join(", ")}
            </p>
          ))}
        </section>
        <section>
          <h2>Education</h2>
          <h3>
            KMIT, Hyderabad{" "}
            <span>B.Tech, Computer Science and Engineering</span>
          </h3>
          <p>2024 - 2028 / CGPA: 8.0</p>
        </section>
        <section>
          <h2>Certifications & Learning</h2>
          <ul>
            {resume.certificates.map((certificate) => (
              <li key={certificate.name}>
                {certificate.name} / {certificate.issuer} ({certificate.date})
              </li>
            ))}
          </ul>
        </section>
        <footer>gollabharath.me / September 2026</footer>
      </article>
    </main>
  );
}
