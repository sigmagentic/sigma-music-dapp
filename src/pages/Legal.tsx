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
