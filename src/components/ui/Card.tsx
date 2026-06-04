import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { TableWrap } from './TableWrap';

function wrapTablesInChildren(node: ReactNode): ReactNode {
  if (node == null || typeof node === 'boolean') return node;

  if (Array.isArray(node)) {
    return Children.map(node, (child) => wrapTablesInChildren(child));
  }

  if (!isValidElement(node)) return node;

  if (typeof node.type === 'string' && node.type === 'table') {
    return <TableWrap key={node.key ?? 'tbl'}>{node}</TableWrap>;
  }

  const el = node as ReactElement<{ children?: ReactNode }>;
  if (el.props.children != null) {
    return cloneElement(el, {}, wrapTablesInChildren(el.props.children));
  }

  return node;
}

export function Card({
  children,
  style,
  className = '',
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`card ${className}`.trim()} style={style}>
      {wrapTablesInChildren(children)}
    </div>
  );
}

export function CardHeader({
  title,
  action,
}: {
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="ch">
      <div className="ct">{title}</div>
      {action}
    </div>
  );
}
