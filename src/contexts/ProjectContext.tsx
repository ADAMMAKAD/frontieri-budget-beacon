import React, { createContext, useContext, useState, useCallback } from 'react';

interface ProjectContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <ProjectContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectRefresh = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectRefresh must be used within a ProjectProvider');
  }
  return context;
};