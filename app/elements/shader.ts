/// <reference path="../typings/threejs/three.d.ts" />

let pgLib = {}; // Global variable to keep all shader templates.

function loadShader(fileName: string) {
    let fileItem = document.createElement("script");
    fileItem.setAttribute("type", "text/javascript");
    fileItem.setAttribute("src", `assets/brdfs/${fileName}.js`);
    document.getElementsByTagName("head")[0].appendChild(fileItem);
}

let figureMaterial = {

    uniforms: {
        // "uLightPos": { type: "v3", value: new THREE.Vector3() }
        "thetaH": { type: "f", value: 0.0 }
    },

   vertexShader: `
uniform float thetaH;

float BRDF(vec3 L, vec3 V, vec3 N)
{
    vec3 H = normalize(L+V);
    float n = 10.0;
    float ior = 1.5;

    float NdotH = dot(N, H);
    float VdotH = dot(V, H);
    float NdotL = dot(N, L);
    float NdotV = dot(N, V);

    float x = acos(NdotH) * n;
    float D = exp( -x*x);
    float G = (NdotV < NdotL) ?
        ((2.0*NdotV*NdotH < VdotH) ?
         2.0*NdotH / VdotH :
         1.0 / NdotV)
        :
        ((2.0*NdotL*NdotH < VdotH) ?
         2.0*NdotH*NdotL / (VdotH*NdotV) :
         1.0 / NdotV);

    // fresnel
    float c = VdotH;
    float g = sqrt(ior*ior + c*c - 1.0);
    float F = 0.5 * pow(g-c,2.0) / pow(g+c,2.0) * (1.0 + pow(c*(g+c)-1.0,2.0) / pow(c*(g-c)+1.0,2.0));

    float val = NdotH < 0.0 ? 0.0 : D * G;
    return val;
}

vec3 rotate( vec3 v, vec3 axis, float angle )
{
    vec3 n;
    axis = normalize( axis );
    n = axis * dot( axis, v );
    return n + cos(angle)*(v-n) + sin(angle)*cross(axis, v);
}

void main(void)
{
    float thetaD = position.x;

    vec3 N = vec3(0,0,1); // normal
    vec3 X = vec3(1,0,0); // tangent
    vec3 Y = vec3(0,1,0); // bitangent

    // synthesize L and V vectors
    vec3 L = rotate(rotate(N, X, thetaD), Y, thetaH);
    vec3 H = rotate(N, Y, thetaH);
    vec3 V = 2.0 * dot(L,H) * H - L;

    float value = BRDF(L, V, N);

    // gl_Position = projectionMatrix * modelViewMatrix * vec4(thetaD, value, 0.0, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}
    `,
    fragmentShader: `
void main() {
    gl_FragColor = vec4( 1.0, 1.0, 0.0, 0.5 );
}
    `
};

let plotObjMaterial = {

    uniforms: {
        "uLightPos": { type: "v3", value: new THREE.Vector3(0, 1, 0) },
        "uDisplayColor": { type: "c", value: new THREE.Color() },
        "uMultiplyCos": { type: "1i", value: 0 },
    },

    vertexShader: `
uniform vec3 uLightPos;
uniform int uMultiplyCos;

varying vec4 vPosition;

{{PHASE_FUNCTION}}

void main(void)
{
    vec3 N = vec3(0.0, 1.0, 0.0);
    vec3 L = normalize(uLightPos.xyz);
    vec3 V = normalize(position.xyz);
    vec3 pos = position.xyz * BRDF(L, V, N);

    if (uMultiplyCos == 1) {
        pos *= max(dot(N, L), 0.0);
    }

    vPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
    `,
    fragmentShader: `
#extension GL_OES_standard_derivatives : enable
uniform vec3 uDisplayColor;
varying vec4 vPosition;

void main() {
    vec3 V = vPosition.xyz;
    vec3 N = normalize(cross(dFdx(V.xyz), dFdy(V.xyz)));
    vec3 L = vec3(0.0, 0.0, 1.0);
    float cosTerm = max(dot(N, L), 0.0);

    gl_FragColor = vec4(uDisplayColor * cosTerm, 1.0);
}`
};

let modelMaterial = {
        uniforms: {
            "uLightPos": { type: "v3", value: new THREE.Vector3() },
            "uLightColor": { type: "c", value: new THREE.Color(0xFFFFFF) }
        },

        vertexShader: `
varying vec3 vNormal;
varying vec4 vPosition;

void main(void)
{
    vNormal = normalMatrix * normal;

    vPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
        `,

        fragmentShader: `
uniform vec3 uLightPos;
uniform vec3 uLightColor;

varying vec3 vNormal;
varying vec4 vPosition;

{{PHASE_FUNCTION}}

void main() {
    vec4 lightPos = viewMatrix * vec4(uLightPos, 0.0);
    vec3 N = normalize(vNormal);
    vec3 L = normalize(vec3(lightPos));
    vec3 V = normalize(vec3(-vPosition));

    float cosTerm = max(dot(N, L), 0.0);
    gl_FragColor.rgb = uLightColor * cosTerm * BRDF(L, V, N);
    gl_FragColor.a = 1.0;
}
        `
};
