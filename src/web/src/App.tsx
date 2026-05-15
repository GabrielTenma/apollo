import { useCallback, useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Apollo</h2>
          <p className="text-base-content/70">
            FlyonUI v2 · Tailwind CSS v4 · React
          </p>
          <div className="card-actions justify-end">
            <button type="button" className="btn btn-primary" onClick={increment}>
              Count is {count}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
