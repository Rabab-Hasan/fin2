import React from 'react';


interface CardProps {
  children?: any;
  className?: string;
  padding?: boolean;
  title?: string;
  style?: React.CSSProperties;
}

function Card(props: CardProps) {
  const { children, className = '', padding = true, title, style } = props;
  return (
    <div className={`card ${padding ? 'p-6' : ''} ${className}`} style={style}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}

export default Card;
