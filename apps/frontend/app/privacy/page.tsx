import type { Metadata } from "next";

import {
  LegalH2,
  LegalP,
  LegalPageShell,
  LegalUl,
} from "@/components/ui/legal-page-shell";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Myujik collects, uses, and protects information when you use collaborative streams.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="March 22, 2026">
      <LegalP>
        This Privacy Policy describes how information is handled when you use
        Myujik (&quot;we&quot;, &quot;us&quot;, or &quot;the service&quot;). The
        operator of each deployment is responsible for how the service is run,
        and this policy explains typical data practices for the application.
      </LegalP>

      <LegalH2>Information we collect</LegalH2>
      <LegalP>Depending on how you use Myujik, we may process:</LegalP>
      <LegalUl>
        <li>
          <strong className="text-gray-900">Account information.</strong> If you
          sign in with Google (or another provider we enable in future), we receive
          identifiers from that provider, such as your email address and
          display name, and we store them in our database so you can use streams
          and the dashboard.
        </li>
        <li>
          <strong className="text-gray-900">Stream activity.</strong> Data you
          generate in the product, for example stream configuration, song
          suggestions, votes, and playback-related state, may be stored and
          synchronized in real time so participants see a shared queue.
        </li>
        <li>
          <strong className="text-gray-900">Technical data.</strong> Like most
          web apps, servers may log requests, IP addresses, and error
          information for security and reliability. WebSocket connections are used
          for live updates between your browser and our servers.
        </li>
      </LegalUl>

      <LegalH2>How we use information</LegalH2>
      <LegalP>We use this information to:</LegalP>
      <LegalUl>
        <li>Provide, operate, and improve the service.</li>
        <li>Authenticate you and maintain your session.</li>
        <li>
          Display collaborative features (queues, votes, stream state) to
          participants you invite.
        </li>
        <li>Protect against abuse, fraud, and security incidents.</li>
        <li>Comply with legal obligations where applicable.</li>
      </LegalUl>

      <LegalH2>Third-party services</LegalH2>
      <LegalP>
        Sign-in may be processed by providers such as{" "}
        <a
          className="text-gray-900 underline underline-offset-2"
          href="https://policies.google.com/privacy"
          rel="noopener noreferrer"
          target="_blank"
        >
          Google
        </a>
        . Embedded or linked content (for example, YouTube) is governed by those
        providers&apos; terms and privacy policies. We do not control how
        third-party sites handle data when you interact with them.
      </LegalP>

      <LegalH2>Cookies and sessions</LegalH2>
      <LegalP>
        We use cookies or similar technologies as required by our authentication
        library (for example, NextAuth.js) to keep you signed in securely. You
        can control cookies through your browser settings, disabling them may
        prevent sign-in from working.
      </LegalP>

      <LegalH2>Retention</LegalH2>
      <LegalP>
        We keep account and stream data for as long as needed to provide the
        service or as required by law. The operator of your deployment may
        define backup and deletion practices, contact them for data requests
        specific to your tenant.
      </LegalP>

      <LegalH2>Security</LegalH2>
      <LegalP>
        We implement reasonable technical and organizational measures to protect
        information. No method of transmission over the internet is completely
        secure, and we cannot guarantee absolute security.
      </LegalP>

      <LegalH2>Your rights</LegalH2>
      <LegalP>
        Depending on where you live, you may have rights to access, correct,
        delete, or export personal data, or to object to certain processing.
        To exercise these rights, contact the operator of this Myujik deployment.
      </LegalP>

      <LegalH2>Children</LegalH2>
      <LegalP>
        Myujik is not directed at children under the age of 13 where parental consent
        is required for online services in your region. We do not knowingly
        collect personal information from children.
      </LegalP>

      <LegalH2>Changes</LegalH2>
      <LegalP>
        We may update this Privacy Policy from time to time. We will adjust the
        &quot;Last updated&quot; date when we do. Continued use of the service
        after changes constitutes acceptance of the updated policy, to the extent
        permitted by law.
      </LegalP>

      <LegalH2>Contact</LegalH2>
      <LegalP>
        For privacy-related questions or requests, contact on{" "}
        <Link
          className="font-bold text-blue-300 underline inline-flex items-center"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.linkedin.com/in/ishanjagani/">
          LinkedIn
          <ExternalLinkIcon className="w-3 h-3" />
        </Link>.
      </LegalP>
    </LegalPageShell>
  );
}
