# Senior Front-End AI-Assisted Coding Challenge

## Time Limit

**40 minutes**

## Objective

You are working on a product search component used in an e-commerce application.

The current implementation works in simple scenarios, but users have reported inconsistent results and poor behavior when typing quickly.

Your task is to use an **AI coding assistant as part of your normal development workflow** to improve the implementation and make it more robust and production-ready.

You are encouraged to use tools such as ChatGPT, Claude, Cursor, Copilot, or any equivalent AI assistant.

## Starting Code

```jsx
import { useEffect, useState } from "react";

export default function ProductSearch() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`/api/products?q=${query}`)
      .then((response) => response.json())
      .then((data) => setProducts(data));
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products"
      />

      {products.map((product) => (
        <div>
          <h3>{product.name}</h3>
          <span>${product.price}</span>
        </div>
      ))}
    </div>
  );
}
```

## Your Task

Review the existing implementation and improve it based on the issues and risks you identify.

You may:

* Modify the existing component.
* Introduce small abstractions if they improve the solution.
* Use relevant Browser APIs or React features.
* Add supporting code where necessary.
* Use AI throughout the exercise to analyze, generate, review, or improve your solution.

Do not try to redesign the entire application. Focus on the changes you believe provide the most value within the available time.

## During the Exercise

We are interested not only in the final code, but also in **how you work with AI**.

Think aloud when possible and make your decision-making process visible.

You should remain responsible for the code you submit. AI-generated suggestions should be reviewed and validated before being incorporated.

## At the End

Be prepared to briefly explain:

* What problems or risks you identified in the original implementation.
* Which improvements you prioritized and why.
* How you used AI during the exercise.
* Which AI suggestions you accepted, modified, or rejected.
* Any technical trade-offs you made.
* How you validated that your solution behaves correctly.
* What you would improve next if this were production code and you had more time.