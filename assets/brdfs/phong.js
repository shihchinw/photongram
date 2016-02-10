/* global pgLib */
/** Phong BRDF. */

pgLib.phong = {

    uniforms: {
        shininess: { type: "f", value: 2.0, uiName: "Shininess", minValue: 1.0, maxValue: 30.0 }
    },

    brdf: `
uniform float shininess;

const float PI = 3.14159265358979323846;

float BRDF(vec3 L, vec3 V, vec3 N)
{
    float norm = (shininess + 2.0) / (2.0 * PI);
    vec3 R = reflect(-L, N);
    return pow(max(dot(R, V), 0.0), shininess) * norm;
}
    `
}