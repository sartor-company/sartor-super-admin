import type { Client } from '../../data/clients';
import { subscriptionPills } from '../../utils/clientDisplay';

export function SubscriptionTierPills({ client }: { client: Client }) {
  return (
    <>
      {subscriptionPills(client).map((pill) => (
        <span key={pill.key} className={pill.className} style={pill.style}>
          {pill.label}
        </span>
      ))}
    </>
  );
}
