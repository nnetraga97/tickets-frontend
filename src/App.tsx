import { AnimatePresence,motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import AppRouter from "./router";
import ErrorBoundary from "./components/ErrorBoundary";
import PageFrame from "./components/PageFrame";
import { TraceInfo } from "./components/TraceInfo";

export default function App() {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <PageFrame>
        <AnimatePresence mode='wait'> 
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className='min-h-[400px]'
          >
            <AppRouter />
          </motion.div>
        </AnimatePresence>
        <TraceInfo />
      </PageFrame>
    </ErrorBoundary>
  );
}
