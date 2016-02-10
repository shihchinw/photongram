/* global pgLib */
/** Cook-Torrance BRDF. */

pgLib["cook-torrance"] = {

    uniforms: {
        m: { type: "f", value: 0.3, uiName: "Roughness", minValue: 0.01, maxValue: 1.0 },
        eta: { type: "f", value: 2.5, uiName: "IOR"}
    },

    brdf: `
uniform float m;
uniform float eta;

const float PI = 3.14159265358979323846;

float BRDF(vec3 L, vec3 V, vec3 N)
{
    vec3 H = normalize(L + V);
    float NdotH = max(dot(N, H), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float VdotH = max(dot(V, H), 0.0);

    float G1 = 2.0 * NdotH * NdotV / VdotH;
    float G2 = 2.0 * NdotH * NdotL / VdotH;
    float G = min(1.0, min(G1, G2));

    // Beckmann NDF
    float NdotH2 = NdotH * NdotH;
    float m2 = m * m;
    float norm = m2 * NdotH2 * NdotH2;
    float D = exp((NdotH2 - 1.0) / (m2 * NdotH2)) / norm;

    // Schlick's approximation for Fresnel
    float F0 = pow((eta - 1.0) / (eta + 1.0), 2.0);
    float F = mix(pow(1.0 - VdotH, 5.0), 1.0, F0);

    return F * D * G / (PI * NdotV * NdotL);
}
    `
}