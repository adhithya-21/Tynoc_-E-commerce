import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  return <main className="not-found"><Sparkles size={30} strokeWidth={1.3} /><span className="eyebrow">WELL, THIS IS A LITTLE AWKWARD</span><h1>Looks like this<br /><em>one wandered off.</em></h1><p>The page you&apos;re looking for isn&apos;t here. But there are plenty of lovely things that are.</p><Link href="/" className="button-dark"><ArrowLeft size={16} /> Back to the good things</Link></main>;
}
