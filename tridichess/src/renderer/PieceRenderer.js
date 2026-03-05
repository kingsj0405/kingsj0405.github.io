/**
 * PieceRenderer.js — Canvas Sprite로 피스 렌더링 (M2 버전)
 *
 * M2 변경사항:
 *   - board를 Array(64) → Map<squareIdString, {type, color}>로 변경
 *   - squareToVector3(squareId) 사용
 */

import * as THREE from 'three';
import { squareToVector3 } from './CoordMapper.js';
import { SquareId } from '../model/SquareId.js';

const SYMBOLS = {
    P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔',
    p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
};

export class PieceRenderer {
    /**
     * @param {THREE.Scene} scene
     */
    constructor(scene) {
        this._scene   = scene;
        this._meshMap = new Map(); // squareIdString → THREE.Sprite
    }

    /**
     * 보드 Map 전체를 받아 피스 스프라이트를 (재)생성한다.
     * @param {Map<string, {type:string, color:string}>} boardMap
     */
    render(boardMap) {
        // 기존 스프라이트 제거
        this._meshMap.forEach(sprite => this._scene.remove(sprite));
        this._meshMap = new Map();

        for (const [sqKey, piece] of boardMap.entries()) {
            const squareId = SquareId.fromString(sqKey);
            const pos = squareToVector3(squareId);

            const sprite = this._createSprite(piece);
            sprite.position.copy(pos);
            sprite.position.y += 6;
            sprite.scale.set(10, 10, 1);

            this._scene.add(sprite);
            this._meshMap.set(sqKey, sprite);
        }
    }

    /** @private */
    _createSprite(piece) {
        const isWhite = piece.color === 'white';
        const char    = isWhite ? piece.type.toUpperCase() : piece.type.toLowerCase();
        const symbol  = SYMBOLS[char] ?? '?';

        const canvas  = document.createElement('canvas');
        canvas.width  = 128;
        canvas.height = 128;
        const ctx     = canvas.getContext('2d');

        ctx.fillStyle = isWhite ? '#fff' : '#222';
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth   = 6;
        ctx.strokeStyle = isWhite ? '#daa520' : '#cc0000';
        ctx.stroke();

        ctx.font         = '90px serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = isWhite ? '#000' : '#cc0000';
        ctx.fillText(symbol, 64, 70);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex });
        return new THREE.Sprite(mat);
    }
}
