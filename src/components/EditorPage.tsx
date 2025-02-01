import Editor from "@/components/Editor";
import Layout from "@/components/Layout";

const EditorPage = () => {
  return (
    <Layout>
      <div className="grid grid-cols-2 gap-6">
        <Editor />
        <div></div>
      </div>
    </Layout>
  );
};

export default EditorPage;
