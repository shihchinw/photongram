/* global pgLib */
/** Blinn-Phong BRDF. */

pgLib["blinn-phong"] = {
    uniforms: {
        shininess: { type: "f", value: 2.0, uiName: "Shininess", minValue: 1.0, maxValue: 30.0 }
    },

    brdf: `
uniform float shininess;

const float PI = 3.14159265358979323846;

float BRDF(vec3 L, vec3 V, vec3 N)
{
    float norm = (shininess + 8.0) / (8.0 * PI);
    vec3 H = normalize(L + V);
    return pow(max(dot(N, H), 0.0), shininess) * norm;
}
    `
}