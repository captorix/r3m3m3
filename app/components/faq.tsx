import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        question: "What is S3F3?",
        answer:
            "S3F3 is a liquid staking platform built on top of the M3M3 mechanism. Users can stake any amount of memecoins and earn farming rewards. S3F3 combines the benefits of staking with additional reward opportunities."
    },
    {
        question: "Do I need to stake tokens to remain in the top 1000?",
        answer:
            "No, the pool already has enough M3M3 staked to keep you in the top 1000 and earn rewards automatically."
    },
    {
        question: "How does liquid staking work on S3F3?",
        answer:
            "When you stake your memecoins on S3F3, you receive a Liquid Staking Token (LST) that represents your staked position, e.g. s3M3M3 for M3M3. This token is tradeable and backed by the staked tokens held within M3M3.",
    },
    {
        question: "How do I earn rewards on S3F3?",
        answer:
            "You earn rewards directly from the M3M3 mechanism. Additionally, S3F3 automatically compounds all farming rewards for you, ensuring optimized earnings over time."
    },
    {
        question: "Can I withdraw my staked assets anytime?",
        answer:
            "Yes, you can unstake your assets by returning your Liquid Staking Tokens to the platform. Unstaking will return your original memecoins along with any accumulated rewards. However, the unstaking process will take the same amount of time as required by M3M3."
    },
    {
        question: "What happens if I sell my LST?",
        answer:
            "Selling your Liquid Staking Tokens transfers your claim to the underlying staked assets and accumulated rewards to the buyer. This provides flexibility, allowing you to exit your position without directly unstaking."
    },
    {
        question: " What are the fees for staking and claiming rewards?",
        answer:
            "The Staking Fee is 1% of the amount you stake, and the Claiming Fee is 10% of the rewards you claim from the protocol. These fees are designed to support the sustainability and smooth operation of the S3F3 platform."
    },
    {
        question: " Is S3F3 audited?",
        answer:
            "Currently, S3F3 has not undergone an audit."
    }

];

export function FAQ() {
    return (
        <div className="bg-black/30 border border-amber-700/20 rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">FAQ</h3>
            <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq: FAQItem, index: number) => (
                    <AccordionItem
                        value={`item-${index}`}
                        key={index}
                        className="border-b border-amber-700/20"
                    >
                        <AccordionTrigger className="text-lg font-semibold text-amber-500">
                            {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-400">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
