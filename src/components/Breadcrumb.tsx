import React from "react";
import { ChevronRight } from "lucide-react";
import "./Breadcrumb.css";

interface BreadcrumbProps {
  items: string[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="breadcrumb" aria-label="Navegação Estrutural">
      <div className="container">
        <ol className="breadcrumb__list">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="breadcrumb__item">
                {isLast ? (
                  <span className="breadcrumb__current" aria-current="page">
                    {item}
                  </span>
                ) : (
                  <>
                    <a href="#" className="breadcrumb__link">
                      {item}
                    </a>
                    <ChevronRight size={12} className="breadcrumb__separator" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};
