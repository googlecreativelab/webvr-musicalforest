// Copyright 2017 Google Inc.
//
//   Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

import { ColorSet } from './color-set';

const BallColors = {

    blue: [
        //              bg       idle     active    stem
        //spheres -  yellow to orange
        new ColorSet( 0xFFC362, 0xFFA544, 0xFFE180, 0xFFA544 ),
        new ColorSet( 0xFFB564, 0xFF9746, 0xFFD382, 0xFF9746 ),
        new ColorSet( 0xFFA765, 0xFF8947, 0xFFC583, 0xFF8947 ),
        new ColorSet( 0xFF9A67, 0xFF7C49, 0xFFB885, 0xFF7C49 ),
        new ColorSet( 0xFF8C68, 0xFF6E4A, 0xFFAA86, 0xFF6E4A ),
        new ColorSet( 0xFF7E6A, 0xFF604C, 0xFF9C88, 0xFF604C ),

        //squares - blue to green
        new ColorSet( 0x49A6E5, 0x308DCC, 0x6CC9FF, 0x308DCC ),
        new ColorSet( 0x3AAED3, 0x2195BA, 0x5DD1F6, 0x2195BA ),
        new ColorSet( 0x2CB7C1, 0x139EA8, 0x4FDAE4, 0x048F99 ),
        new ColorSet( 0x1DBFAE, 0x04A695, 0x40E2D1, 0x04A695 ),
        new ColorSet( 0x0FC89C, 0x00AF83, 0x32EBBF, 0x00AF83 ),
        new ColorSet( 0x00D08A, 0x00B771, 0x23F3AD, 0x00B771 ),

        //triangles - purple to light blue
        new ColorSet( 0xAC44C8, 0x932AAF, 0xDE76FA, 0x982FB4 ),
        new ColorSet( 0xA258D3, 0x893FBA, 0xD48AFF, 0x8E44BF ),
        new ColorSet( 0x986DDE, 0x7F54C5, 0xCA9FFF, 0x8459CA ),
        new ColorSet( 0x8D81E8, 0x7468CF, 0xBFB3FF, 0x796DD4 ),
        new ColorSet( 0x8396F3, 0x6A7DDA, 0xB5C8FF, 0x6F82DF ),
        new ColorSet( 0x79AAFE, 0x6091E5, 0xABDCFF, 0x6596EA ),
    ],
    red: [
        //              bg       idle     active    stem
        //spheres -  yellow to orange
        new ColorSet( 0xFFC362, 0xFFA544, 0xFFE180, 0xFFA544 ),
        new ColorSet( 0xFFB564, 0xFF9746, 0xFFD382, 0xFF9746 ),
        new ColorSet( 0xFFA765, 0xFF8947, 0xFFC583, 0xFF8947 ),
        new ColorSet( 0xFF9A67, 0xFF7C49, 0xFFB885, 0xFF7C49 ),
        new ColorSet( 0xFF8C68, 0xFF6E4A, 0xFFAA86, 0xFF6E4A ),
        new ColorSet( 0xFF7E6A, 0xFF604C, 0xFF9C88, 0xFF604C ),

        //squares - blue to green
        new ColorSet( 0x49A6E5, 0x308DCC, 0x6CC9FF, 0x308DCC ),
        new ColorSet( 0x3AAED3, 0x2195BA, 0x5DD1F6, 0x2195BA ),
        new ColorSet( 0x2CB7C1, 0x139EA8, 0x4FDAE4, 0x048F99 ),
        new ColorSet( 0x1DBFAE, 0x04A695, 0x40E2D1, 0x04A695 ),
        new ColorSet( 0x0FC89C, 0x00AF83, 0x32EBBF, 0x00AF83 ),
        new ColorSet( 0x00D08A, 0x00B771, 0x23F3AD, 0x00B771 ),

        //triangles - purple to light blue
        new ColorSet( 0xAC44C8, 0x932AAF, 0xDE76FA, 0x982FB4 ),
        new ColorSet( 0xA258D3, 0x893FBA, 0xD48AFF, 0x8E44BF ),
        new ColorSet( 0x986DDE, 0x7F54C5, 0xCA9FFF, 0x8459CA ),
        new ColorSet( 0x8D81E8, 0x7468CF, 0xBFB3FF, 0x796DD4 ),
        new ColorSet( 0x8396F3, 0x6A7DDA, 0xB5C8FF, 0x6F82DF ),
        new ColorSet( 0x79AAFE, 0x6091E5, 0xABDCFF, 0x6596EA ),

    ],

    green: [
        //              bg       idle     active    stem
        //spheres -  yellow to orange
        new ColorSet( 0xFFC362, 0xFFA544, 0xFFE180, 0xFFA544 ),
        new ColorSet( 0xFFB564, 0xFF9746, 0xFFD382, 0xFF9746 ),
        new ColorSet( 0xFFA765, 0xFF8947, 0xFFC583, 0xFF8947 ),
        new ColorSet( 0xFF9A67, 0xFF7C49, 0xFFB885, 0xFF7C49 ),
        new ColorSet( 0xFF8C68, 0xFF6E4A, 0xFFAA86, 0xFF6E4A ),
        new ColorSet( 0xFF7E6A, 0xFF604C, 0xFF9C88, 0xFF604C ),

        //squares - blue to green
        new ColorSet( 0x49A6E5, 0x308DCC, 0x6CC9FF, 0x308DCC ),
        new ColorSet( 0x3AAED3, 0x2195BA, 0x5DD1F6, 0x2195BA ),
        new ColorSet( 0x2CB7C1, 0x139EA8, 0x4FDAE4, 0x048F99 ),
        new ColorSet( 0x1DBFAE, 0x04A695, 0x40E2D1, 0x04A695 ),
        new ColorSet( 0x0FC89C, 0x00AF83, 0x32EBBF, 0x00AF83 ),
        new ColorSet( 0x00D08A, 0x00B771, 0x23F3AD, 0x00B771 ),

        //triangles - purple to light blue
        new ColorSet( 0xAC44C8, 0x932AAF, 0xDE76FA, 0x982FB4 ),
        new ColorSet( 0xA258D3, 0x893FBA, 0xD48AFF, 0x8E44BF ),
        new ColorSet( 0x986DDE, 0x7F54C5, 0xCA9FFF, 0x8459CA ),
        new ColorSet( 0x8D81E8, 0x7468CF, 0xBFB3FF, 0x796DD4 ),
        new ColorSet( 0x8396F3, 0x6A7DDA, 0xB5C8FF, 0x6F82DF ),
        new ColorSet( 0x79AAFE, 0x6091E5, 0xABDCFF, 0x6596EA ),

    ],

};

const ControllerColors = {
    //          bg       grain
    blue:  [ 0x5396f2, 0x5261f2 ],
    red:   [ 0xec4c4e, 0xc14040 ],
    green: [ 0x93cbc4, 0x58a868 ]
};

const BgTreeColors = [ 0x827193, 0xa08293, 0xc59498 ];

const EnvColors = {
    floor: 0xF79F99,
    fog: 0xe9a69a
};

const ShadowColor = 0xdf978b;

const HeadsetColor = 0xE8E8E8;
const HeadsetShadow = 0xAFAFAF;

export { BallColors, ControllerColors, BgTreeColors, EnvColors, ShadowColor, HeadsetColor, HeadsetShadow };
