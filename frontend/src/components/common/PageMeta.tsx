import { useEffect } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  useEffect(() => {
    document.title = title;
  }, [title]); 

  return (
    <Helmet>     
      <meta name="description" content={description} />
    </Helmet>
  );
};

const helmetContext = {};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider context={helmetContext}>
    {children}
  </HelmetProvider>
);

export default PageMeta;
