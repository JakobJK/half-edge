class Vertex {
    constructor(position) {
        this.position = position;
        this.halfEdge = null;
    }
}

class Face {
    constructor() {
        this.halfEdge = null;
    }
}

class HalfEdge {
    constructor(vertex) {
        this.vertex = vertex;
        this.next = null;
        this.prev = null;
        this.twin = null;
        this.face = null;
    }
}

function createHalfEdgeMesh(vertices, faces) {
    const halfEdges = [];
    const vertexObjects = vertices.map((v) => new Vertex(v));
    const faceObjects = faces.map(() => new Face());

    faces.forEach((faceIndices, faceIndex) => {
        const n = faceIndices.length;
        faceIndices.forEach((vertexIndex, i) => {
            const halfEdge = new HalfEdge(vertexObjects[vertexIndex]);
            halfEdges.push(halfEdge);

            halfEdge.face = faceObjects[faceIndex];

            if (i > 0) {
                halfEdges[halfEdges.length - 2].next = halfEdge;
                halfEdge.prev = halfEdges[halfEdges.length - 2];
            }

            if (i === n - 1) {
                halfEdge.next = halfEdges[halfEdges.length - n];
                halfEdges[halfEdges.length - n].prev = halfEdge;
            }

            vertexObjects[vertexIndex].halfEdge = halfEdge;
            faceObjects[faceIndex].halfEdge = halfEdge;

        });
    });

    // Set up twin relationships
    halfEdges.forEach((halfEdge) => {
        if (!halfEdge.twin) {
            const candidate = halfEdges.find((e) => e.vertex === halfEdge.next.vertex && e.next.vertex === halfEdge.vertex);
            if (candidate) {
                halfEdge.twin = candidate;
                candidate.twin = halfEdge;
            }
        }
    });

    return { vertices: vertexObjects, halfEdges, faces: faceObjects };
}


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const vertices = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
];

const faces = [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
];

const { vertices: heVertices, faces: heFaces } = createHalfEdgeMesh(vertices, faces);

const geometry = new THREE.BufferGeometry();

const positions = [];
const indices = [];

heVertices.forEach((v) => positions.push(...v.position.toArray()));

heFaces.forEach((face) => {
    let currentHalfEdge = face.halfEdge;
    const faceIndices = [];

    do {
        faceIndices.push(heVertices.indexOf(currentHalfEdge.vertex));
        currentHalfEdge = currentHalfEdge.next;
    } while (currentHalfEdge !== face.halfEdge);

    indices.push(...faceIndices);
});

geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setIndex(indices);
geometry.computeVertexNormals();


const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

camera.position.z = 3;

function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
    renderer.render(scene, camera);
}

animate();
