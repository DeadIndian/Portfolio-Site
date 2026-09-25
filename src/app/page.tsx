import { Portfolio } from "@/components/worlds/WorldPortfolio";
import resume from "../../resumeData.json";

export default function Home() {
  return (
    <Portfolio
      profile={{
        email: resume.personalInfo.email,
        skillsDisplay: resume.skillsDisplay,
        experienceBullets: resume.experience[0].bullets,
        certificates: resume.certificates.map(
          ({ name, issuer, date, url }) => ({
            name,
            issuer,
            date,
            ...(url ? { url } : {}),
          }),
        ),
      }}
    />
  );
}
