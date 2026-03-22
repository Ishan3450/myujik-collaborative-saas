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
  title: "Terms of Service",
  description:
    "Terms governing your use of Myujik collaborative music streaming rooms.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="March 22, 2026">
      <LegalP>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of Myujik (&quot;we&quot;, &quot;us&quot;, or &quot;the service&quot;), a
        web application for hosting collaborative listening sessions with shared
        queues and real-time updates. By using Myujik, you agree to these Terms.
      </LegalP>

      <LegalP>
        This is a personal side project built for learning purposes.
        Use it at your own risk. All music content is played via
        YouTube official embed API and belongs to their respective owners.
      </LegalP>

      <LegalH2>Eligibility and accounts</LegalH2>
      <LegalP>
        You may need to sign in with a third-party provider (such as Google) to
        create streams or access certain features. You are responsible for
        maintaining the security of your account and for activity that occurs
        under it.
      </LegalP>

      <LegalH2>Acceptable use</LegalH2>
      <LegalP>You agree not to:</LegalP>
      <LegalUl>
        <li>
          Use the service in violation of applicable law or third-party rights.
        </li>
        <li>
          Abuse, disrupt, or attempt to gain unauthorized access to the service,
          other users, or connected systems.
        </li>
        <li>
          Use the service to distribute malware, spam, or harmful content.
        </li>
        <li>
          Circumvent technical limits we apply to protect the service or other
          users.
        </li>
      </LegalUl>

      <LegalH2>User content and third-party services</LegalH2>
      <LegalP>
        Users may share links and metadata related to content hosted on
        third-party platforms (for example, YouTube). Myujik does not host
        audio or video files from those platforms; playback may be subject to
        the terms and policies of those providers. You are responsible for
        ensuring you have the right to share and play content in your
        jurisdiction and context (for example, in a private or public stream).
      </LegalP>

      <LegalH2>Intellectual property</LegalH2>
      <LegalP>
        The Myujik name, branding, and software are protected by applicable
        intellectual property laws. We grant you a limited, non-exclusive,
        non-transferable right to use the service in accordance with these
        Terms. You retain rights to content you submit, you grant us only the
        rights needed to operate the service (for example, storing and
        displaying suggestions and votes within your streams).
      </LegalP>

      <LegalH2>Disclaimer of warranties</LegalH2>
      <LegalP>
        The service is provided &quot;as is&quot; and &quot;as available&quot;
        without warranties of any kind, whether express or implied, including
        implied warranties of merchantability, fitness for a particular
        purpose, and non-infringement. We do not warrant uninterrupted or
        error-free operation.
      </LegalP>

      <LegalH2>Limitation of liability</LegalH2>
      <LegalP>
        To the fullest extent permitted by law, we will not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or
        any loss of profits, data, or goodwill, arising from your use of the
        service.
      </LegalP>

      <LegalH2>Changes and termination</LegalH2>
      <LegalP>
        We may modify these Terms or the service. We will post updated Terms
        with a new &quot;Last updated&quot; date. Continued use after changes
        constitutes acceptance. We may suspend or terminate access if you
        violate these Terms or if we need to protect the service or others.
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
