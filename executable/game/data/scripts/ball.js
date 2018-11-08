/////////////////////////////////////////////////////
//*-----------------------------------------------*//
//| Part of Throw Out (https://www.maus-games.at) |//
//*-----------------------------------------------*//
//| Released under the zlib License               |//
//| More information available in the readme file |//
//*-----------------------------------------------*//
/////////////////////////////////////////////////////
"use strict";


// ****************************************************************
cBall.s_afVertexData =
[0.000000, 0.000000, 0.000000,   0.0, 0.0, 0.0,   // unused vertex
0.000000, -1.000000, 0.000000,   0.0, 0.0, 0.0,
0.723607, -0.447220, 0.525725,   0.0, 0.0, 0.0,
-0.276388, -0.447220, 0.850649,  0.0, 0.0, 0.0,
-0.894426, -0.447216, 0.000000,  0.0, 0.0, 0.0,
-0.276388, -0.447220, -0.850649, 0.0, 0.0, 0.0,
0.723607, -0.447220, -0.525725,  0.0, 0.0, 0.0,
0.276388, 0.447220, 0.850649,    0.0, 0.0, 0.0,
-0.723607, 0.447220, 0.525725,   0.0, 0.0, 0.0,
-0.723607, 0.447220, -0.525725,  0.0, 0.0, 0.0,
0.276388, 0.447220, -0.850649,   0.0, 0.0, 0.0,
0.894426, 0.447216, 0.000000,    0.0, 0.0, 0.0,
0.000000, 1.000000, 0.000000,    0.0, 0.0, 0.0,
0.203181, -0.967950, 0.147618,   0.0, 0.0, 0.0,
0.425323, -0.850654, 0.309011,   0.0, 0.0, 0.0,
0.609547, -0.657519, 0.442856,   0.0, 0.0, 0.0,
0.531941, -0.502302, 0.681712,   0.0, 0.0, 0.0,
0.262869, -0.525738, 0.809012,   0.0, 0.0, 0.0,
-0.029639, -0.502302, 0.864184,  0.0, 0.0, 0.0,
-0.232822, -0.657519, 0.716563,  0.0, 0.0, 0.0,
-0.162456, -0.850654, 0.499995,  0.0, 0.0, 0.0,
-0.077607, -0.967950, 0.238853,  0.0, 0.0, 0.0,
0.203181, -0.967950, -0.147618,  0.0, 0.0, 0.0,
0.425323, -0.850654, -0.309011,  0.0, 0.0, 0.0,
0.609547, -0.657519, -0.442856,  0.0, 0.0, 0.0,
0.812729, -0.502301, -0.295238,  0.0, 0.0, 0.0,
0.850648, -0.525736, 0.000000,   0.0, 0.0, 0.0,
0.812729, -0.502301, 0.295238,   0.0, 0.0, 0.0,
-0.483971, -0.502302, 0.716565,  0.0, 0.0, 0.0,
-0.688189, -0.525736, 0.499997,  0.0, 0.0, 0.0,
-0.831051, -0.502299, 0.238853,  0.0, 0.0, 0.0,
-0.753442, -0.657515, 0.000000,  0.0, 0.0, 0.0,
-0.525730, -0.850652, 0.000000,  0.0, 0.0, 0.0,
-0.251147, -0.967949, 0.000000,  0.0, 0.0, 0.0,
-0.831051, -0.502299, -0.238853, 0.0, 0.0, 0.0,
-0.688189, -0.525736, -0.499997, 0.0, 0.0, 0.0,
-0.483971, -0.502302, -0.716565, 0.0, 0.0, 0.0,
-0.232822, -0.657519, -0.716563, 0.0, 0.0, 0.0,
-0.162456, -0.850654, -0.499995, 0.0, 0.0, 0.0,
-0.077607, -0.967950, -0.238853, 0.0, 0.0, 0.0,
-0.029639, -0.502302, -0.864184, 0.0, 0.0, 0.0,
0.262869, -0.525738, -0.809012,  0.0, 0.0, 0.0,
0.531941, -0.502302, -0.681712,  0.0, 0.0, 0.0,
0.860698, -0.251151, -0.442858,  0.0, 0.0, 0.0,
0.951058, 0.000000, -0.309013,   0.0, 0.0, 0.0,
0.956626, 0.251149, -0.147618,   0.0, 0.0, 0.0,
0.956626, 0.251149, 0.147618,    0.0, 0.0, 0.0,
0.951058, -0.000000, 0.309013,   0.0, 0.0, 0.0,
0.860698, -0.251151, 0.442858,   0.0, 0.0, 0.0,
0.687159, -0.251152, 0.681715,   0.0, 0.0, 0.0,
0.587786, 0.000000, 0.809017,    0.0, 0.0, 0.0,
0.436007, 0.251152, 0.864188,    0.0, 0.0, 0.0,
0.155215, 0.251152, 0.955422,    0.0, 0.0, 0.0,
0.000000, -0.000000, 1.000000,   0.0, 0.0, 0.0,
-0.155215, -0.251152, 0.955422,  0.0, 0.0, 0.0,
-0.436007, -0.251152, 0.864188,  0.0, 0.0, 0.0,
-0.587786, 0.000000, 0.809017,   0.0, 0.0, 0.0,
-0.687159, 0.251152, 0.681715,   0.0, 0.0, 0.0,
-0.860698, 0.251151, 0.442858,   0.0, 0.0, 0.0,
-0.951058, -0.000000, 0.309013,  0.0, 0.0, 0.0,
-0.956626, -0.251149, 0.147618,  0.0, 0.0, 0.0,
-0.956626, -0.251149, -0.147618, 0.0, 0.0, 0.0,
-0.951058, 0.000000, -0.309013,  0.0, 0.0, 0.0,
-0.860698, 0.251151, -0.442858,  0.0, 0.0, 0.0,
-0.687159, 0.251152, -0.681715,  0.0, 0.0, 0.0,
-0.587786, -0.000000, -0.809017, 0.0, 0.0, 0.0,
-0.436007, -0.251152, -0.864188, 0.0, 0.0, 0.0,
-0.155215, -0.251152, -0.955422, 0.0, 0.0, 0.0,
0.000000, 0.000000, -1.000000,   0.0, 0.0, 0.0,
0.155215, 0.251152, -0.955422,   0.0, 0.0, 0.0,
0.436007, 0.251152, -0.864188,   0.0, 0.0, 0.0,
0.587786, -0.000000, -0.809017,  0.0, 0.0, 0.0,
0.687159, -0.251152, -0.681715,  0.0, 0.0, 0.0,
0.831051, 0.502299, 0.238853,    0.0, 0.0, 0.0,
0.688189, 0.525736, 0.499997,    0.0, 0.0, 0.0,
0.483971, 0.502302, 0.716565,    0.0, 0.0, 0.0,
0.029639, 0.502302, 0.864184,    0.0, 0.0, 0.0,
-0.262869, 0.525738, 0.809012,   0.0, 0.0, 0.0,
-0.531941, 0.502302, 0.681712,   0.0, 0.0, 0.0,
-0.812729, 0.502301, 0.295238,   0.0, 0.0, 0.0,
-0.850648, 0.525736, 0.000000,   0.0, 0.0, 0.0,
-0.812729, 0.502301, -0.295238,  0.0, 0.0, 0.0,
-0.531941, 0.502302, -0.681712,  0.0, 0.0, 0.0,
-0.262869, 0.525738, -0.809012,  0.0, 0.0, 0.0,
0.029639, 0.502302, -0.864184,   0.0, 0.0, 0.0,
0.483971, 0.502302, -0.716565,   0.0, 0.0, 0.0,
0.688189, 0.525736, -0.499997,   0.0, 0.0, 0.0,
0.831051, 0.502299, -0.238853,   0.0, 0.0, 0.0,
0.753442, 0.657515, 0.000000,    0.0, 0.0, 0.0,
0.525730, 0.850652, 0.000000,    0.0, 0.0, 0.0,
0.251147, 0.967949, 0.000000,    0.0, 0.0, 0.0,
0.077607, 0.967950, 0.238853,    0.0, 0.0, 0.0,
0.162456, 0.850654, 0.499995,    0.0, 0.0, 0.0,
0.232822, 0.657519, 0.716563,    0.0, 0.0, 0.0,
-0.203181, 0.967950, 0.147618,   0.0, 0.0, 0.0,
-0.425323, 0.850654, 0.309011,   0.0, 0.0, 0.0,
-0.609547, 0.657519, 0.442856,   0.0, 0.0, 0.0,
-0.203181, 0.967950, -0.147618,  0.0, 0.0, 0.0,
-0.425323, 0.850654, -0.309011,  0.0, 0.0, 0.0,
-0.609547, 0.657519, -0.442856,  0.0, 0.0, 0.0,
0.077607, 0.967950, -0.238853,   0.0, 0.0, 0.0,
0.162456, 0.850654, -0.499995,   0.0, 0.0, 0.0,
0.232822, 0.657519, -0.716563,   0.0, 0.0, 0.0,
0.052790, -0.723612, 0.688185,   0.0, 0.0, 0.0,
0.138199, -0.894429, 0.425321,   0.0, 0.0, 0.0,
0.361805, -0.723611, 0.587779,   0.0, 0.0, 0.0,
0.670817, -0.723611, -0.162457,  0.0, 0.0, 0.0,
0.670818, -0.723610, 0.162458,   0.0, 0.0, 0.0,
0.447211, -0.894428, 0.000001,   0.0, 0.0, 0.0,
-0.638195, -0.723609, 0.262864,  0.0, 0.0, 0.0,
-0.361801, -0.894428, 0.262864,  0.0, 0.0, 0.0,
-0.447211, -0.723610, 0.525729,  0.0, 0.0, 0.0,
-0.447211, -0.723612, -0.525727, 0.0, 0.0, 0.0,
-0.361801, -0.894429, -0.262863, 0.0, 0.0, 0.0,
-0.638195, -0.723609, -0.262863, 0.0, 0.0, 0.0,
0.361803, -0.723612, -0.587779,  0.0, 0.0, 0.0,
0.138197, -0.894429, -0.425321,  0.0, 0.0, 0.0,
0.052789, -0.723611, -0.688186,  0.0, 0.0, 0.0,
1.000000, 0.000000, 0.000000,    0.0, 0.0, 0.0,
0.947213, -0.276396, 0.162458,   0.0, 0.0, 0.0,
0.947213, -0.276396, -0.162458,  0.0, 0.0, 0.0,
0.309017, 0.000000, 0.951056,    0.0, 0.0, 0.0,
0.138199, -0.276398, 0.951055,   0.0, 0.0, 0.0,
0.447216, -0.276398, 0.850648,   0.0, 0.0, 0.0,
-0.809018, 0.000000, 0.587783,   0.0, 0.0, 0.0,
-0.861803, -0.276396, 0.425324,  0.0, 0.0, 0.0,
-0.670819, -0.276397, 0.688191,  0.0, 0.0, 0.0,
-0.809018, -0.000000, -0.587783, 0.0, 0.0, 0.0,
-0.670819, -0.276397, -0.688191, 0.0, 0.0, 0.0,
-0.861803, -0.276396, -0.425324, 0.0, 0.0, 0.0,
0.309017, -0.000000, -0.951056,  0.0, 0.0, 0.0,
0.447216, -0.276398, -0.850648,  0.0, 0.0, 0.0,
0.138199, -0.276398, -0.951055,  0.0, 0.0, 0.0,
0.670820, 0.276396, 0.688190,    0.0, 0.0, 0.0,
0.809019, -0.000002, 0.587783,   0.0, 0.0, 0.0,
0.861804, 0.276394, 0.425323,    0.0, 0.0, 0.0,
-0.447216, 0.276397, 0.850648,   0.0, 0.0, 0.0,
-0.309017, -0.000001, 0.951056,  0.0, 0.0, 0.0,
-0.138199, 0.276397, 0.951055,   0.0, 0.0, 0.0,
-0.947213, 0.276396, -0.162458,  0.0, 0.0, 0.0,
-1.000000, 0.000001, 0.000000,   0.0, 0.0, 0.0,
-0.947213, 0.276397, 0.162458,   0.0, 0.0, 0.0,
-0.138199, 0.276397, -0.951055,  0.0, 0.0, 0.0,
-0.309016, -0.000000, -0.951057, 0.0, 0.0, 0.0,
-0.447215, 0.276397, -0.850649,  0.0, 0.0, 0.0,
0.861804, 0.276396, -0.425322,   0.0, 0.0, 0.0,
0.809019, 0.000000, -0.587782,   0.0, 0.0, 0.0,
0.670821, 0.276397, -0.688189,   0.0, 0.0, 0.0,
0.361800, 0.894429, 0.262863,    0.0, 0.0, 0.0,
0.447209, 0.723612, 0.525728,    0.0, 0.0, 0.0,
0.638194, 0.723610, 0.262864,    0.0, 0.0, 0.0,
-0.138197, 0.894430, 0.425319,   0.0, 0.0, 0.0,
-0.361804, 0.723612, 0.587778,   0.0, 0.0, 0.0,
-0.052790, 0.723612, 0.688185,   0.0, 0.0, 0.0,
-0.447210, 0.894429, 0.000000,   0.0, 0.0, 0.0,
-0.670817, 0.723611, -0.162457,  0.0, 0.0, 0.0,
-0.670817, 0.723611, 0.162457,   0.0, 0.0, 0.0,
-0.138197, 0.894430, -0.425319,  0.0, 0.0, 0.0,
-0.052790, 0.723612, -0.688185,  0.0, 0.0, 0.0,
-0.361804, 0.723612, -0.587778,  0.0, 0.0, 0.0,
0.361800, 0.894429, -0.262863,   0.0, 0.0, 0.0,
0.638194, 0.723610, -0.262864,   0.0, 0.0, 0.0,
0.447209, 0.723612, -0.525728,   0.0, 0.0, 0.0];
                      
cBall.s_aiIndexData =
[1, 13, 21, 2, 15, 27, 1, 21, 33, 1, 33, 39, 1, 39, 22, 2, 27, 48, 3, 18, 54, 4, 30, 60, 5, 36, 66, 6, 42, 72, 2, 48, 49, 3, 54, 55, 4, 60, 61, 5, 66, 67, 6, 72, 43, 7, 75, 93, 8, 78, 96, 9, 81, 99, 10, 84, 102, 11, 87, 88, 19, 18, 3, 20, 103, 19, 21, 104, 20, 19, 103, 18, 103, 17, 18, 20, 104, 103, 104, 105, 103, 103, 105, 17, 105, 16, 17, 21, 13, 104, 13, 14, 104, 104, 14, 105, 14, 15, 105, 105, 15, 16, 15, 2, 16, 25, 24, 6, 26, 106, 25, 27, 107, 26, 25, 106, 24, 106, 23, 24, 26, 107, 106, 107, 108, 106, 106, 108, 23, 108, 22, 23, 27, 15, 107, 15, 14, 107, 107, 14, 108, 14, 13, 108, 108, 13, 22, 13, 1, 22, 31, 30, 4, 32, 109, 31, 33, 110, 32, 31, 109, 30, 109, 29, 30, 32, 110, 109, 110, 111, 109, 109, 111, 29, 111, 28, 29, 33, 21, 110, 21, 20, 110, 110, 20, 111, 20, 19, 111, 111, 19, 28, 19, 3, 28, 37, 36, 5, 38, 112, 37, 39, 113, 38, 37, 112, 36, 112, 35, 36, 38, 113, 112, 113, 114, 112, 112, 114, 35, 114, 34, 35, 39, 33, 113, 33, 32, 113, 113, 32, 114, 32, 31, 114, 114, 31, 34, 31, 4, 34, 24, 42, 6, 23, 115, 24, 22, 116, 23, 24, 115, 42, 115, 41, 42, 23, 116, 115, 116, 117, 115, 115, 117, 41, 117, 40, 41, 22, 39, 116, 39, 38, 116, 116, 38, 117, 38, 37, 117, 117, 37, 40, 37, 5, 40, 46, 45, 11, 47, 118, 46, 48, 119, 47, 46, 118, 45, 118, 44, 45, 47, 119, 118, 119, 120, 118, 118, 120, 44, 120, 43, 44, 48, 27, 119, 27, 26, 119, 119, 26, 120, 26, 25, 120, 120, 25, 43, 25, 6, 43, 52, 51, 7, 53, 121, 52, 54, 122, 53, 52, 121, 51, 121, 50, 51, 53, 122, 121, 122, 123, 121, 121, 123, 50, 123, 49, 50, 54, 18, 122, 18, 17, 122, 122, 17, 123, 17, 16, 123, 123, 16, 49, 16, 2, 49, 58, 57, 8, 59, 124, 58, 60, 125, 59, 58, 124, 57, 124, 56, 57, 59, 125, 124, 125, 126, 124, 124, 126, 56, 126, 55, 56, 60, 30, 125, 30, 29, 125, 125, 29, 126, 29, 28, 126, 126, 28, 55, 28, 3, 55, 64, 63, 9, 65, 127, 64, 66, 128, 65, 64, 127, 63, 127, 62, 63, 65, 128, 127, 128, 129, 127, 127, 129, 62, 129, 61, 62, 66, 36, 128, 36, 35, 128, 128, 35, 129, 35, 34, 129, 129, 34, 61, 34, 4, 61, 70, 69, 10, 71, 130, 70, 72, 131, 71, 70, 130, 69, 130, 68, 69, 71, 131, 130, 131, 132, 130, 130, 132, 68, 132, 67, 68, 72, 42, 131, 42, 41, 131, 131, 41, 132, 41, 40, 132, 132, 40, 67, 40, 5, 67, 51, 75, 7, 50, 133, 51, 49, 134, 50, 51, 133, 75, 133, 74, 75, 50, 134, 133, 134, 135, 133, 133, 135, 74, 135, 73, 74, 49, 48, 134, 48, 47, 134, 134, 47, 135, 47, 46, 135, 135, 46, 73, 46, 11, 73, 57, 78, 8, 56, 136, 57, 55, 137, 56, 57, 136, 78, 136, 77, 78, 56, 137, 136, 137, 138, 136, 136, 138, 77, 138, 76, 77, 55, 54, 137, 54, 53, 137, 137, 53, 138, 53, 52, 138, 138, 52, 76, 52, 7, 76, 63, 81, 9, 62, 139, 63, 61, 140, 62, 63, 139, 81, 139, 80, 81, 62, 140, 139, 140, 141, 139, 139, 141, 80, 141, 79, 80, 61, 60, 140, 60, 59, 140, 140, 59, 141, 59, 58, 141, 141, 58, 79, 58, 8, 79, 69, 84, 10, 68, 142, 69, 67, 143, 68, 69, 142, 84, 142, 83, 84, 68, 143, 142, 143, 144, 142, 142, 144, 83, 144, 82, 83, 67, 66, 143, 66, 65, 143, 143, 65, 144, 65, 64, 144, 144, 64, 82, 64, 9, 82, 45, 87, 11, 44, 145, 45, 43, 146, 44, 45, 145, 87, 145, 86, 87, 44, 146, 145, 146, 147, 145, 145, 147, 86, 147, 85, 86, 43, 72, 146, 72, 71, 146, 146, 71, 147, 71, 70, 147, 147, 70, 85, 70, 10, 85, 91, 90, 12, 92, 148, 91, 93, 149, 92, 91, 148, 90, 148, 89, 90, 92, 149, 148, 149, 150, 148, 148, 150, 89, 150, 88, 89, 93, 75, 149, 75, 74, 149, 149, 74, 150, 74, 73, 150, 150, 73, 88, 73, 11, 88, 94, 91, 12, 95, 151, 94, 96, 152, 95, 94, 151, 91, 151, 92, 91, 95, 152, 151, 152, 153, 151, 151, 153, 92, 153, 93, 92, 96, 78, 152, 78, 77, 152, 152, 77, 153, 77, 76, 153, 153, 76, 93, 76, 7, 93, 97, 94, 12, 98, 154, 97, 99, 155, 98, 97, 154, 94, 154, 95, 94, 98, 155, 154, 155, 156, 154, 154, 156, 95, 156, 96, 95, 99, 81, 155, 81, 80, 155, 155, 80, 156, 80, 79, 156, 156, 79, 96, 79, 8, 96, 100, 97, 12, 101, 157, 100, 102, 158, 101, 100, 157, 97, 157, 98, 97, 101, 158, 157, 158, 159, 157, 157, 159, 98, 159, 99, 98, 102, 84, 158, 84, 83, 158, 158, 83, 159, 83, 82, 159, 159, 82, 99, 82, 9, 99, 90, 100, 12, 89, 160, 90, 88, 161, 89, 90, 160, 100, 160, 101, 100, 89, 161, 160, 161, 162, 160, 160, 162, 101, 162, 102, 101, 88, 87, 161, 87, 86, 161, 161, 86, 162, 86, 85, 162, 162, 85, 102, 85, 10, 102];

cBall.s_sVertexShader =
"attribute vec3 a_v3Position;"                                      +
"uniform   mat4 u_m4ModelViewProj;"                                 +
"uniform   mat4 u_m4ModelView;"                                     +
"varying   vec3 v_v3Relative;"                                      +
"varying   vec3 v_v3Normal;"                                        +
""                                                                  +
"void main()"                                                       +
"{"                                                                 +
"    v_v3Relative = (u_m4ModelView * vec4(a_v3Position, 1.0)).xyz;" +
"    v_v3Normal   = a_v3Position;"                                  +
""                                                                  +
"    gl_Position  = u_m4ModelViewProj * vec4(a_v3Position, 1.0);"   +
"}";

cBall.s_sFragmentShader =
"precision mediump float;"                                                    +
""                                                                            +
"uniform float u_fAlpha;"                                                     +
"varying vec3  v_v3Relative;"                                                 +
"varying vec3  v_v3Normal;"                                                   +
""                                                                            +
"void main()"                                                                 +
"{"                                                                           +
"    const vec3 v3Camera = vec3(0.0, 0.447213650, -0.894427299);"             +
"    const vec3 v3Light  = vec3(0.0,         0.0,          1.0);"             +
""                                                                            +
"    float fIntensity = 43.0 * inversesqrt(dot(v_v3Relative, v_v3Relative));" +
"    fIntensity      *= dot(normalize(v_v3Relative), v3Camera);"              +
""                                                                            +
"    fIntensity *= dot(normalize(v_v3Normal), v3Light)*0.5+0.5;"              +
""                                                                            +
"    gl_FragColor = vec4(vec3(fIntensity), u_fAlpha);"                        +
"}";

var C_BALL_SIZE     = 0.9;
var C_BALL_START    = vec2.fromValues(0.0, -32.0);
var C_BALL_DISPLACE = 3.0;


// ****************************************************************
cBall.s_pModel  = null;
cBall.s_pShader = null;

// saved uniform values
cBall.s_iSaveAlpha = 0.0;

// pre-allocated function variables
cBall.s_vPreOldPos   = vec2.create();
cBall.s_vPreTrueSize = vec4.create();
cBall.s_vPreDiff     = vec2.create();
cBall.s_vPreBurst    = vec2.create();

// size vector
cBall.s_vSize = vec3.fromValues(C_BALL_SIZE, C_BALL_SIZE, C_BALL_SIZE);


// ****************************************************************
cBall.Init = function()
{
    // define model and shader-program
    cBall.s_pModel  = new cModel(cBall.s_afVertexData, cBall.s_aiIndexData);
    cBall.s_pShader = new cShader(cBall.s_sVertexShader, cBall.s_sFragmentShader);
};


// ****************************************************************
cBall.Exit = function()
{
    // clear model and shader-program
    cBall.s_pModel.Clear();
    cBall.s_pShader.Clear();
};


// ****************************************************************
function cBall()
{
    // create attributes
    this.m_vPosition  = vec3.fromValues(0.0, 0.0, C_BALL_SIZE);
    this.m_vDirection = vec2.create();
    this.m_mTransform = mat4.create();

    this.m_fAlpha     = 0.0;
    this.m_fSpeed     = 42.0;
    this.m_bActive    = false;

    this.m_iHitBlock  = 0;
    this.m_iHitPaddle = 0;
    this.m_fLifeTime  = 0.0;
}


// ****************************************************************
cBall.prototype.Render = function()
{
    if(!this.m_bActive) return;

    // enable the shader-program
    cBall.s_pShader.Enable();

    // update model-view matrices
    mat4.mul(g_mMatrix, g_mCamera, this.m_mTransform);
    GL.uniformMatrix4fv(cBall.s_pShader.m_iUniformModelView,     false, g_mMatrix);
    mat4.mul(g_mMatrix, g_mProjection, g_mMatrix);
    GL.uniformMatrix4fv(cBall.s_pShader.m_iUniformModelViewProj, false, g_mMatrix);

    // check and update current alpha (check to reduce video bandwidth)
    if(cBall.s_iSaveAlpha !== this.m_fAlpha) {cBall.s_iSaveAlpha = this.m_fAlpha; GL.uniform1f(cBall.s_pShader.m_iUniformAlpha, this.m_fAlpha);}

    // render the model
    cBall.s_pModel.Render();
};


// ****************************************************************
cBall.prototype.Move = function()
{
    if(!this.m_bActive) return;

    var fTimeSpeed = g_fTime*this.m_fSpeed;
    vec2.copy(cBall.s_vPreOldPos, this.m_vPosition);

    // move ball
    this.m_vPosition[0] += this.m_vDirection[0]*fTimeSpeed;
    this.m_vPosition[1] += this.m_vDirection[1]*fTimeSpeed;

    // update life time
    this.m_fLifeTime += g_fTime;

    // reset paddle status (always)
    this.m_iHitPaddle = 0;

    // get current plane distance (single value)
    var fMaxPos = Clamp((60.0 - Math.max(Math.abs(this.m_vPosition[0]), Math.abs(this.m_vPosition[1])))*0.05, 0.0, 1.0);

    // update alpha (fade-out during transition, otherwise fade-in)
    this.m_fAlpha = Math.min(this.m_fAlpha + g_fTime*(InTransition() ? -3.0 : 3.0), 1.0) * fMaxPos;

    // destroy on zero visibility (too far away from plane or fade-out after level was finished)
    if(this.m_fAlpha <= 0.0)
    {
        if(GJAPI.bActive)
        {
            // ball lost too fast, add trophy
            if(!InTransition() && this.m_fLifeTime < 5.0)
                GJAPI.TrophyAchieve(5740);
        }

        this.m_bActive = false;
        return;
    }

    // do not test collision on level transition
    if(!InTransition())
    {
        // pre-calculate ball-position with offset between block and ball
        cBall.s_vPreTrueSize[0] = this.m_vPosition[0] - C_BLOCK_BALL_OFF;
        cBall.s_vPreTrueSize[1] = this.m_vPosition[0] + C_BLOCK_BALL_OFF;
        cBall.s_vPreTrueSize[2] = this.m_vPosition[1] - C_BLOCK_BALL_OFF;
        cBall.s_vPreTrueSize[3] = this.m_vPosition[1] + C_BLOCK_BALL_OFF;

        // test collision with blocks and get nearest block
        var iNum = -1;
        var fDistance = 1000.0;
        for(var i = 0; i < C_LEVEL_ALL; ++i)
        {
            if(g_pBlock[i].m_bFlying) continue;

            // test collision (current position for the test, old position for direction calculations (better precision), ball as cube)
            if(cBall.s_vPreTrueSize[0] < g_pBlock[i].m_vPosition[0] &&
               cBall.s_vPreTrueSize[1] > g_pBlock[i].m_vPosition[0] &&
               cBall.s_vPreTrueSize[2] < g_pBlock[i].m_vPosition[1] &&
               cBall.s_vPreTrueSize[3] > g_pBlock[i].m_vPosition[1])
            {
                var fNewDistance = vec2.sqrDist(cBall.s_vPreOldPos, g_pBlock[i].m_vPosition);
                if(fDistance > fNewDistance)
                {
                    // get nearest block
                    iNum = i;
                    fDistance = fNewDistance;
                }
            }
        }

        this.m_iHitBlock = 0;
        if(iNum >= 0)
        {
            var iDir = 0;
            this.m_iHitBlock = iNum+1;

            // calculate position-difference with old position
            var vDiff = cBall.s_vPreDiff;
            vec2.sub(vDiff, cBall.s_vPreOldPos, g_pBlock[iNum].m_vPosition);

            if(iNum >= C_LEVEL_CENTER)
            {
                // reflect ball-direction from the border
                iDir = (iNum >= C_LEVEL_CENTER+2*C_LEVEL_BX) ? 0 : 1;
                vDiff[iDir] = Math.abs(vDiff[iDir]) * -Signf(cBall.s_vPreOldPos[iDir]);
            }
            else
            {
                // reflect ball-direction depending on the angle of the position-difference
                if(Math.abs(vDiff[0]) > Math.abs(vDiff[1])) iDir = (Signf(vDiff[0]) === Signf(this.m_vDirection[0])) ? 1 : 0;
                                                       else iDir = (Signf(vDiff[1]) === Signf(this.m_vDirection[1])) ? 0 : 1;
            }
            this.m_vDirection[iDir] = Math.abs(this.m_vDirection[iDir]) * Signf(vDiff[iDir]);

            // set burst-direction to kick only blocks in an 180 degree area
            vec2.set(cBall.s_vPreBurst, 0.0, 0.0);
            cBall.s_vPreBurst[iDir] = -Signf(vDiff[iDir]);

            // move ball away from the block (vDiff not normalized)
            var fTime = g_fTime * C_BALL_DISPLACE;
            this.m_vPosition[0] += vDiff[0]*fTime;
            this.m_vPosition[1] += vDiff[1]*fTime;
            
            // play sound
            g_pSoundBump.Play(1.3);

            // kick all near relevant blocks away
            var iValid = 0;
            for(var j = 0; j < C_LEVEL_ALL; ++j)
            {
                if(g_pBlock[j].m_bFlying) continue;

                // calculate position-difference with current position
                vec2.sub(vDiff, this.m_vPosition, g_pBlock[j].m_vPosition);
                if(Math.abs(vDiff[0]) < C_HIT_RANGE &&
                   Math.abs(vDiff[1]) < C_HIT_RANGE)
                {
                    if(vec2.dot(cBall.s_vPreBurst, vDiff) < 0.0)
                    {
                        // calculate damage
                        var fDamage = (C_HIT_RANGE - vec2.squaredLength(vDiff))*C_HIT_INVERT;
                        if(fDamage > 0.0)
                        {
                            // damage block
                            g_pBlock[j].m_fHealth -= fDamage;
                            if(g_pBlock[j].m_fHealth <= 0.0)
                            {
                                vec2.normalize(vDiff, vDiff);

                                // increase or decrease score
                                var fScore = (j < C_LEVEL_CENTER) ? 5.0*g_fStatMulti : -10.0;
                                g_iScore += fScore;

                                // accumulate negative score
                                if(GJAPI.bActive)
                                {
                                    // negative score too high, add trophy (only-1-send switch behind function)
                                    if(fScore < 0.0) g_fGameJoltNeg += fScore;
                                    if(g_fGameJoltNeg <= -100.0)
                                        GJAPI.TrophyAchieve(5738);
                                }

                                // handle typed blocks
                                if(g_pBlock[j].m_iType === 1)
                                {
                                    // create new ball
                                    cBall.CreateBall(g_pBlock[j].m_vPosition, vDiff, false);
                                }
                                if(g_pBlock[j].m_iType === 2)
                                {
                                    // make paddles longer
                                    for(var k = 0; k < 4; ++k)
                                        g_pPaddle[k].m_bShield = true;
                                }

                                // throw the block out
                                vec2.negate(vDiff, vDiff);
                                g_pBlock[j].Throw(vDiff, 30.0);
                            }
                        }
                    }
                }

                // still a valid center block
                if(!g_pBlock[j].m_bFlying && j < C_LEVEL_CENTER) ++iValid;
            }

            // check for cleared level
            if(!iValid) NextLevel(false);
        }

        // pre-calculate ball-position with ball-size
        cBall.s_vPreTrueSize[0] = this.m_vPosition[0] - C_BALL_SIZE;
        cBall.s_vPreTrueSize[1] = this.m_vPosition[0] + C_BALL_SIZE;
        cBall.s_vPreTrueSize[2] = this.m_vPosition[1] - C_BALL_SIZE;
        cBall.s_vPreTrueSize[3] = this.m_vPosition[1] + C_BALL_SIZE;

        // test collision with paddles
        for(var i = 0; i < 4; ++i)
        {
            // (direction is set on paddle creation, 0/bottom, 1/up, 2/left, 3/right)
            var iX = (i < 2) ? 0 : 1;
            var iY = (i < 2) ? 1 : 0;

            if(g_pPaddle[i].m_bWall)
            {
                if(vec2.dot(this.m_vDirection, g_pPaddle[i].m_vDirection) > 0.0) continue;

                // simply reflect the ball from a wall-paddle
                var bHit = false;
                     if(i === 0 && cBall.s_vPreTrueSize[2] < g_pPaddle[i].m_vPosition[1] + C_PADDLE_RANGE) {this.m_vDirection[1] =  Math.abs(this.m_vDirection[1]); bHit = true;}
                else if(i === 1 && cBall.s_vPreTrueSize[3] > g_pPaddle[i].m_vPosition[1] - C_PADDLE_RANGE) {this.m_vDirection[1] = -Math.abs(this.m_vDirection[1]); bHit = true;}
                else if(i === 2 && cBall.s_vPreTrueSize[0] < g_pPaddle[i].m_vPosition[0] + C_PADDLE_RANGE) {this.m_vDirection[0] =  Math.abs(this.m_vDirection[0]); bHit = true;}
                else if(i === 3 && cBall.s_vPreTrueSize[1] > g_pPaddle[i].m_vPosition[0] - C_PADDLE_RANGE) {this.m_vDirection[0] = -Math.abs(this.m_vDirection[0]); bHit = true;}

                if(bHit)
                {
                    this.m_iHitPaddle = i+1;
                    if(g_pPaddle[iX ? 2 : 0].m_bWall && g_pPaddle[iX ? 3 : 1].m_bWall && Math.abs(this.m_vDirection[iX]) < 0.15)
                    {
                        // prevent infinite ball
                        this.m_vDirection[iX] = -1.0*Signf(this.m_vPosition[iX]);
                    }

                    // always normalize direction
                    vec2.normalize(this.m_vDirection, this.m_vDirection);

                    // start bump-effect
                    g_pPaddle[i].m_fBump = 1.0;
                    g_pSoundBump.Play(1.05);
                }
            }
            else
            {
                // set paddle size
                vec2.set(g_vVector, (g_pPaddle[i].m_vSize[0] > 5.0) ? 100.0 : (g_pPaddle[i].m_vSize[0]*3.8), C_PADDLE_RANGE);

                if(cBall.s_vPreTrueSize[0] < g_pPaddle[i].m_vPosition[0] + g_vVector[iX] &&
                   cBall.s_vPreTrueSize[1] > g_pPaddle[i].m_vPosition[0] - g_vVector[iX] &&
                   cBall.s_vPreTrueSize[2] < g_pPaddle[i].m_vPosition[1] + g_vVector[iY] &&
                   cBall.s_vPreTrueSize[3] > g_pPaddle[i].m_vPosition[1] - g_vVector[iY] &&
                   vec2.dot(this.m_vDirection, g_pPaddle[i].m_vDirection) < 0.0)
                {
                    this.m_iHitPaddle = i+1;

                    // calculate position-difference with old position
                    var vDiff = cBall.s_vPreDiff;
                    vec2.sub(vDiff, cBall.s_vPreOldPos, g_pPaddle[i].m_vPosition);

                    // adapt and normalize the vector
                    vDiff[iX] *= 0.12/g_pPaddle[i].m_vSize[0];
                    vDiff[iY]  = 1.5875 * g_pPaddle[i].m_vDirection[iY]; // 1.5875 = 0.9+0.55*1.25
                    vec2.normalize(vDiff, vDiff);

                    // reflect ball
                    Reflect(this.m_vDirection, this.m_vDirection, vDiff);
                    this.m_vDirection[iY] = Math.max(Math.abs(this.m_vDirection[iY]), 0.35) * g_pPaddle[i].m_vDirection[iY];
                    vec2.normalize(this.m_vDirection, this.m_vDirection);

                    // start bump-effect
                    g_pPaddle[i].m_fBump = 1.0;
                    g_pSoundBump.Play(1.05);

                    // reset paddle-hit time
                    g_fGameJoltFly = 0.0;
                }
            }
        }
    }

    // update transformation matrix
    mat4.identity(this.m_mTransform);
    mat4.scale(this.m_mTransform, this.m_mTransform, cBall.s_vSize);
    mat4.translate(this.m_mTransform, this.m_mTransform, this.m_vPosition);
};


// ****************************************************************
cBall.CreateBall = function(vPosition, vDirection, bFirst)
{
    for(var i = 0; i < C_BALLS; ++i)
    {
        if(!g_pBall[i].m_bActive)
        {
            // activate and init new ball
            g_pBall[i].m_bActive = true;
            vec2.copy(g_pBall[i].m_vPosition, vPosition);
            vec2.normalize(g_pBall[i].m_vDirection, vDirection);

            // hide him on start
            g_pBall[i].m_fAlpha = bFirst ? 0.0 : 0.5;
            mat4.scale(g_pBall[i].m_mTransform, g_pBall[i].m_mTransform, [0.0, 0.0, 0.0]);

            // reset life time
            g_pBall[i].m_fLifeTime = 0.0;

            // reset camera acceleration
            g_fCamAcc = 0.3;

            return;
        }
    }
};