import { useState } from "react";
import { Search } from "lucide-react";
import type { Budget } from "../lib/data";
import { TransactionTable } from "../widgets/Budget";

export function TransactionsView({ budget }: { budget: Budget }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const transactions = budget.transactions.filter((t) =>
    `${t.merchant} ${t.category}`.toLowerCase().includes(query),
  );
  return (
    <section className="panel">
      <div className="transaction-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            type="search"
            aria-label="Filter transactions"
            placeholder="Search merchants or categories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <span>
          {query
            ? `${transactions.length} of ${budget.transactions.length}`
            : `${budget.transactions.length} seeded transactions`}
        </span>
      </div>
      <TransactionTable budget={{ ...budget, transactions }} />
    </section>
  );
}
