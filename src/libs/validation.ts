import _ from "lodash";
import { ComplexTypeValidationErrors } from "../types/validation";

export function mergeComplexTypeValidationErrors(a: ComplexTypeValidationErrors, b: ComplexTypeValidationErrors): ComplexTypeValidationErrors {
  return _.mergeWith(a, b, (objValue, srcValue) => {
    if(_.isArray(objValue) && _.isArray(srcValue)) {
      return objValue.concat(srcValue)
    }
  })
}
