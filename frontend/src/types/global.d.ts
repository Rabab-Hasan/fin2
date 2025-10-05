declare module 'react-router-dom' {
  export interface RouteProps {
    path?: string;
    element?: React.ReactNode;
    children?: React.ReactNode;
  }
  
  export interface RoutesProps {
    children?: React.ReactNode;
  }
  
  export interface LinkProps {
    to: string;
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }
  
  export const Routes: React.FC<RoutesProps>;
  export const Route: React.FC<RouteProps>;
  export const BrowserRouter: React.FC<{ children?: React.ReactNode }>;
  export const Link: React.FC<LinkProps>;
  export const useNavigate: () => (to: string) => void;
  export const useLocation: () => { pathname: string };
}

declare module 'recharts' {
  export interface XAxisProps {
    dataKey?: string;
    [key: string]: any;
  }
  
  export interface YAxisProps {
    [key: string]: any;
  }
  
  export interface TooltipProps {
    [key: string]: any;
  }
  
  export interface CartesianGridProps {
    strokeDasharray?: string;
    [key: string]: any;
  }
  
  export interface BarChartProps {
    data?: any[];
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface LineChartProps {
    data?: any[];
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface ResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface BarProps {
    dataKey?: string;
    fill?: string;
    [key: string]: any;
  }
  
  export interface LineProps {
    type?: string;
    dataKey?: string;
    stroke?: string;
    strokeWidth?: number;
    [key: string]: any;
  }
  
  export const XAxis: React.FC<XAxisProps>;
  export const YAxis: React.FC<YAxisProps>;
  export const Tooltip: React.FC<TooltipProps>;
  export const CartesianGrid: React.FC<CartesianGridProps>;
  export const BarChart: React.FC<BarChartProps>;
  export const LineChart: React.FC<LineChartProps>;
  export const ResponsiveContainer: React.FC<ResponsiveContainerProps>;
  export const Bar: React.FC<BarProps>;
  export const Line: React.FC<LineProps>;
}

declare namespace React {
  interface FC<P = {}> {
    (props: P & { children?: ReactNode }): ReactElement | null;
    propTypes?: WeakValidationMap<P>;
    contextTypes?: ValidationMap<any>;
    defaultProps?: Partial<P>;
    displayName?: string;
  }

  function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  
  interface StrictModeProps {
    children?: ReactNode;
  }
  
  const StrictMode: FC<StrictModeProps>;
  
  interface DragEvent<T = Element> extends MouseEvent<T, NativeDragEvent> {}
  interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: EventTarget & T;
  }
  interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  
  function useMemo<T>(factory: () => T, deps: DependencyList | undefined): T;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
