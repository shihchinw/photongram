/* global pgLib */
/** Lambert BRDF. */

pgLib.lambert = {

    uniforms: {
        kd: { type: "f", value: 1.0, uiName: "Reflectance", minValue: 0.0, maxValue: 1.0 }
    },

    brdf: `
uniform float kd;

const float PI = 3.14159265358979323846;

float BRDF(vec3 L, vec3 V, vec3 N)
{
    return kd / PI;
}
    `
}