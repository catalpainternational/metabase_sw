/* eslint-disable react/prop-types */
import cx from "classnames";

export default function FieldSet({
  className = "border-brand",
  legend,
  noPadding,
  children,
}) {
  const fieldSetClassName = cx("bordered rounded", { "px2 pb2": !noPadding });

  return (
    <fieldset className={cx(className, fieldSetClassName)}>
      {legend && (
        <legend className="h5 text-bold text-uppercase px1 text-nowrap text-medium">
          {legend}
        </legend>
      )}
      <div className="w-full">{children}</div>
    </fieldset>
  );
}
