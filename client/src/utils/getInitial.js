const getInitial = (name) => {
    return (
      name
        ?.charAt(0)
        ?.toUpperCase() || "?"
    );
  };
export default getInitial;