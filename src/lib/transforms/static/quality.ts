import { Transform } from "../transform";
import { qualityRect } from "../../../var/unit-card-rects";

export class QualityTransform extends Transform {
  name = "quality"
  rectangle = qualityRect;
}