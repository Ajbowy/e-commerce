import { ShieldCheck, Truck, RotateCcw } from "lucide-react";

const BADGES = [
  { icon: ShieldCheck, label: "Secure checkout", detail: "Payments processed by Paystack" },
  { icon: Truck, label: "Fast delivery", detail: "Order tracking on every purchase" },
  { icon: RotateCcw, label: "Easy returns", detail: "Hassle-free within 7 days" },
];

export function TrustBadges() {
  return (
    <ul className="mt-6 space-y-3 border-t pt-6 text-sm">
      {BADGES.map(({ icon: Icon, label, detail }) => (
        <li key={label} className="flex items-start gap-3">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-muted-foreground">{detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
