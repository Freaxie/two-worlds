// Shared "stage" for the protocol scenes: a dark floor far in front of the strata network,
// so the network survives only as a faint, fogged backdrop.
import * as THREE from 'three';

export const STAGE = { x: 0, y: 0, z: 420 };

export function makeStage({ floorY = -2.62 } = {}) {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.set(STAGE.x, STAGE.y, STAGE.z);
  group.add(inner);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x040706, roughness: 0.42, metalness: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = floorY;
  inner.add(floor);
  return { group, inner, floor };
}
