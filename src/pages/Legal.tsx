import { useEffect, useState } from "react";
import { routeNames } from "routes";

interface LegalSection {
  title: string;
  questions: {
    id: string;
    question: string;
    answer: JSX.Element;
  }[];
}

const legalSections: LegalSection[] = [
  {
    title: "Legals",
    questions: [
      {
        id: "terms-of-use",
        question: "Terms of Use",
        answer: (
          <div className="space-y-4">
            <p>By accessing and using Sigma Music's platform, you acknowledge and agree to the following terms:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Sigma Music is an early-stage application that uses innovative technology and should be considered to be in Beta stage. This means the platform
                may contain bugs, experience downtime, or undergo significant changes.
              </li>
              <li>You understand that using our platform involves inherent risks, and you accept full responsibility for any such risks.</li>
              <li>Sigma Music and its affiliates are not liable for any damages, losses, or issues arising from your use of the platform.</li>
              <li>We reserve the right to modify, suspend, or terminate any aspect of the platform at any time.</li>
              <li>You are responsible for maintaining the security of your account and any associated wallet.</li>
              <li>
                All content on the platform is provided "as is" by the musicians and artists we work with. While we make it clear to artists that they should
                not post misleading content or content that doesn't belong to them, we are not liable for any content that is misleading, breaches copyright
                laws, or is offensive. If you encounter such content, please report it to us for investigation.
              </li>
              <li>
                Artists can upload content and are responsible for tagging it with the appropriate content warnings, therefore this site is not intended for
                children under the age of 18 as it may contain explicit content that is not suitable for minors.
              </li>
              <li>
                If you are an artist, you are also bound by the{" "}
                <a href="#terms-of-launching-music" className="text-yellow-300 hover:text-yellow-300 transition-colors">
                  Terms of Launching Music
                </a>{" "}
                as outlined in this document.
              </li>
            </ul>
            <p className="mt-4">
              For any questions or concerns regarding these terms, please contact us through our{" "}
              <a
                href="https://t.me/SigmaXMusicOfficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-300 hover:text-yellow-300 transition-colors">
                Telegram support channel
              </a>{" "}
              or email us at{" "}
              <a href="mailto:support@zedgehorizon.com" className="text-yellow-300 hover:text-yellow-300 transition-colors">
                support@zedgehorizon.com
              </a>
              .
            </p>
          </div>
        ),
      },
      {
        id: "privacy-policy",
        question: "Privacy Policy",
        answer: (
          <div className="space-y-4">
            <p>At Sigma Music, we take your privacy seriously. Here's how we handle your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We collect and store your email address, name, and order details specific to your purchases.</li>
              <li>If you connect a Solana wallet, we store your public key for order fulfillment and tracking.</li>
              <li>We do not store any credit card information. All payment processing is handled securely by our payment providers.</li>
              <li>Your data is stored in the EU region.</li>
            </ul>
            <p className="mt-4">
              By using our platform, you consent to the collection and processing of your data as described above. We implement appropriate security measures to
              protect your personal information.
            </p>
            <p className="mt-4">
              For any questions or concerns regarding these terms, please contact us through our{" "}
              <a
                href="https://t.me/SigmaXMusicOfficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-300 hover:text-yellow-300 transition-colors">
                Telegram support channel
              </a>{" "}
              or email us at{" "}
              <a href="mailto:support@zedgehorizon.com" className="text-yellow-300 hover:text-yellow-300 transition-colors">
                support@zedgehorizon.com
              </a>
              .
            </p>
          </div>
        ),
      },
      {
        id: "terms-of-sale",
        question: "Terms of Sale",
        answer: (
          <div className="space-y-4">
            <p>When purchasing music albums or other digital assets on Sigma Music:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Please refer to our Privacy Policy for information about how we collect and handle your data.</li>
              <li>Currently, we do not offer refunds for digital purchases.</li>
              <li>However, we are committed to customer satisfaction and will work with you if you're unhappy with your purchase.</li>
              <li>
                All content available for purchase is provided directly by the artists. While we work with artists to ensure they only post their own work, we
                are not liable for any content that may be misleading, infringe on copyrights, or be offensive. If you have concerns about any content, please
                report it to us for investigation.
              </li>
            </ul>
            <p className="mt-4">
              If you have any issues with your purchase or encounter problematic content, please contact us through our{" "}
              <a
                href="https://t.me/SigmaXMusicOfficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-300 hover:text-yellow-300 transition-colors">
                Telegram support channel
              </a>{" "}
              or email us at{" "}
              <a href="mailto:support@zedgehorizon.com" className="text-yellow-300 hover:text-yellow-300 transition-colors">
                support@zedgehorizon.com
              </a>
              . We'll do our best to assist you and find a satisfactory resolution.
            </p>
          </div>
        ),
      },
      {
        id: "terms-of-launching-music",
        question: "Terms of Launching Music",
        answer: (
          <div className="space-y-4">
            <p>By uploading, publishing, or selling music on Sigma Music, you ("the Artist") agree to the following terms:</p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">1. Ownership and Rights</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    You confirm that you are the sole owner of the music you upload or that you have obtained all necessary rights, licenses, and permissions to
                    publish and commercialize the content on Sigma Music.
                  </li>
                  <li>
                    You confirm that uploading your music does not breach any copyright, contract, or other legal obligations you may have with labels,
                    distributors, or third parties.
                  </li>
                  <li>You retain full ownership of your music but grant Sigma Music the rights listed below to operate the platform.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">2. License to Sigma Music</h4>
                <p>By uploading your music, you grant Sigma Music a worldwide, non-exclusive, royalty-free, and perpetual license to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>
                    Stream, display, and promote your music on Sigma Music and its connected services (including APIs, mobile apps, social platforms, and
                    promotional channels).
                  </li>
                  <li>Use your music and related materials (e.g., album art, titles, descriptions) for marketing, discovery, and promotional purposes.</li>
                </ul>
                <p className="mt-2">This license exists solely to enable Sigma Music to operate and promote your content within its ecosystem.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">3. Artist Responsibility</h4>
                <p>You take full legal and financial responsibility for the content you upload:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>You agree not to upload, publish, or sell any content that you do not have full rights to.</li>
                  <li>
                    You agree not to unpublish, alter, or materially change any album, EP, or single after it has been purchased or licensed by fans. Doing so
                    may mislead buyers, and you accept responsibility for any refunds, disputes, or claims that result.
                  </li>
                  <li>You agree to accurately tag any explicit content and acknowledge that Sigma Music may remove or restrict untagged explicit material.</li>
                  <li>
                    You may not upload or distribute content that promotes hate, discrimination, abuse, or illegal activity. Sigma Music reserves the right to
                    remove such content at its discretion.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">4. Sales and Payouts</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Artists and labels receive 80% of net sales revenue, with 20% retained by Sigma Music as a platform fee.</li>
                  <li>Payouts are processed at Sigma Music's discretion, typically within the first two weeks of each month for the prior month's sales.</li>
                  <li>Delays may occur due to processing, technical, or regulatory reasons.</li>
                  <li>Sigma Music is not responsible for payment delays caused by third-party payment providers or external systems.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">5. Label Representation</h4>
                <p>
                  If you are acting on behalf of a label or collective, you confirm that you have full legal authority to upload, promote, and sell the music of
                  the artists you represent.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">6. Indemnity</h4>
                <p>
                  You agree to indemnify and hold harmless Sigma Music, its founders, employees, and partners from any claims, damages, losses, or legal costs
                  arising from:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Breach of these terms</li>
                  <li>Copyright infringement</li>
                  <li>Misrepresentation of ownership or rights</li>
                  <li>Any other dispute between you and a third party related to your uploaded content.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">7. Limitation of Liability</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Sigma Music is provided "as is" and makes no guarantees regarding sales, exposure, or income.</li>
                  <li>
                    Sigma Music is not liable for any indirect, incidental, or consequential damages (including loss of revenue, data, or reputation) arising
                    from your use of the platform.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">8. Content Removal</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Sigma Music reserves the right to suspend or remove content that violates these terms or applicable law, without prior notice.</li>
                  <li>
                    In cases of repeated or severe violations, Sigma Music may terminate your account and withhold pending payouts until disputes are resolved.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">9. Album / EP IP Rights & Licensing Terms</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    if you intend to sell your music with IP Rights & Licensing enabled, you confirm and agree to the terms outlined in the "Selling Album / EP
                    IP Rights & Licensing Terms" section below.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">10. General Clause</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>These terms may be updated periodically. Continued use of the platform after updates constitutes your acceptance of the new terms.</li>
                  <li>Any disputes shall be governed by the laws of New South Wales, Australia.</li>
                  <li>
                    By using Sigma Music, you agree that Sigma Music's total liability in any claim will not exceed the total amount of platform fees earned
                    from your content during the prior 12 months.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "terms-of-selling-album-ep-licenses",
        question: "Selling Album / EP IP Rights & Licensing",
        answer: (
          <div className="space-y-4">
            <p className="font-semibold text-white mb-2">Album / EP Rights & Licensing Grant</p>
            <p>By publishing an Album or EP on Sigma Music and enabling a Commercial Use License for it, you confirm and agree to the following:</p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Rights Ownership</h4>
                <p>
                  You either: (a) own all copyrights to the sound recordings and compositions of every track included in the Album/EP, or (b) have secured full
                  written permission from all rights holders to license and authorize the use of those tracks in the manner described here.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">License Grant</h4>
                <p>You grant Sigma Music the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Offer and resell commercial-use or remix licenses for the Album/EP as a collective work</li>
                  <li>
                    Authorize buyers to create derivative works (including remixes, edits, or transformations) of any track included in the Album/EP, in line
                    with the terms shown at the time of license purchase
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Ownership Retained</h4>
                <p>You retain all original ownership and copyright over your music. This agreement does not transfer or assign your copyrights.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Samples & Collaborators</h4>
                <p>
                  If any track includes samples, co-writers, featured artists, session musicians, or producers who hold rights, you are responsible for ensuring
                  that all required licenses and permissions have been obtained to allow derivative and commercial use.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Responsibility & Indemnity</h4>
                <p>
                  You agree to indemnify and hold Sigma Music harmless from any claims or disputes that arise due to missing permissions, copyright issues, or
                  ownership conflicts relating to the tracks in your Album/EP.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "take-down-policy",
        question: "Take Down Policy",
        answer: (
          <div className="space-y-4">
            <p>
              Sigma Music respects the intellectual property rights of artists, creators, and copyright holders. If you believe that any content on Sigma Music
              infringes your copyright or violates any legal rights, you can request its removal by contacting us directly.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">How to Submit a Take Down Request</h4>
                <p>
                  Please contact us through our{" "}
                  <a
                    href="https://t.me/SigmaXMusicOfficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-300 hover:text-yellow-300 transition-colors">
                    Telegram support channel
                  </a>{" "}
                  or email us at{" "}
                  <a href="mailto:support@zedgehorizon.com" className="text-yellow-300 hover:text-yellow-300 transition-colors">
                    support@zedgehorizon.com
                  </a>
                  .
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Your Request Should Include</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your full name and contact information</li>
                  <li>The URL or title of the content you believe infringes your rights</li>
                  <li>A short description of the issue (e.g., copyright claim, offensive content, impersonation, etc.)</li>
                  <li>Proof of ownership or authority (if applicable)</li>
                  <li>
                    A statement confirming that the information you've provided is accurate and that you are the rightful owner (or authorized to act on behalf
                    of the owner)
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Review Process</h4>
                <p>
                  Sigma Music will review all take down requests promptly and may remove or restrict access to the content in question while investigating the
                  claim.
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
];

export const Legal = () => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Initialize all sections as expanded
    const initialExpanded = legalSections.reduce(
      (acc, section) => {
        acc[section.title] = true;
        return acc;
      },
      {} as { [key: string]: boolean }
    );
    setExpandedSections(initialExpanded);

    // Handle hash-based navigation
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash) {
        // Wait for elements to be rendered
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100); // Small delay to ensure elements are rendered
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const scrollToQuestion = (questionId: string) => {
    const element = document.getElementById(questionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      // Update URL hash without triggering a page reload
      window.history.pushState(null, "", `#${questionId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Legal Information</h1>
        <button
          onClick={() => (window.location.href = `${routeNames.home}`)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors">
          Back to App
        </button>
      </div>

      {/* Table of Contents */}
      <div className="mb-12 bg-gray-800 p-6 rounded-lg">
        <div className="space-y-4">
          {legalSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-lg font-semibold text-yellow-300">{section.title}</h3>
              <ul className="list-disc pl-6 space-y-2">
                {section.questions.map((question) => (
                  <li key={question.id}>
                    <button onClick={() => scrollToQuestion(question.id)} className="text-yellow-300 hover:text-yellow-300 transition-colors text-left">
                      {question.question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Sections */}
      {legalSections.map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
          <div className="space-y-4">
            {section.questions.map((item) => (
              <div key={item.id} id={item.id} className="bg-black text-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3 !text-yellow-300">{item.question}</h3>
                <div className="text-gray-400">{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
