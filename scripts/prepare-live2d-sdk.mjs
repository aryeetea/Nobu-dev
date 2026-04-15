import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const zipPath = process.argv[2] ?? join(process.env.HOME ?? '', 'Downloads/CubismSdkForNative-5-r.5.zip')
const extractRoot = join(root, 'vendor/live2d/sdk-source')
const sourceDir = join(extractRoot, basename(zipPath, '.zip'))
const iosDir = join(root, 'vendor/live2d/ios')
const androidDir = join(root, 'vendor/live2d/android')

function patchMetalCommandBuffer(sdkDir) {
  const path = join(sdkDir, 'Framework/src/Rendering/Metal/CubismCommandBuffer_Metal.mm')
  if (!existsSync(path)) {
    return
  }

  let source = readFileSync(path, 'utf8')
  source = source.replace(
    `    _vertices = [device newBufferWithLength:_vbStride * count
                                                options:MTLResourceStorageModeShared];

    _uvs = [device newBufferWithLength:_vbStride * count
                                                options:MTLResourceStorageModeShared];`,
    `    csmSizeInt bufferLength = _vbStride * count;
    if (bufferLength == 0)
    {
        bufferLength = 1;
    }

    _vertices = [device newBufferWithLength:bufferLength
                                                options:MTLResourceStorageModeShared];

    _uvs = [device newBufferWithLength:bufferLength
                                                options:MTLResourceStorageModeShared];`,
  )
  source = source.replace(
    `    _indices = [device newBufferWithLength:sizeof(csmInt16) * _ibCount
                                                options:MTLResourceStorageModeShared];`,
    `    csmSizeInt bufferLength = sizeof(csmInt16) * _ibCount;
    if (bufferLength == 0)
    {
        bufferLength = sizeof(csmInt16);
    }

    _indices = [device newBufferWithLength:bufferLength
                                                options:MTLResourceStorageModeShared];`,
  )
  source = source.replace(
    `    csmFloat32* destVertices = reinterpret_cast<csmFloat32*>([_vertices contents]);`,
    `    if (length == 0 || data == NULL || uvData == NULL)
    {
        return;
    }

    csmFloat32* destVertices = reinterpret_cast<csmFloat32*>([_vertices contents]);`,
  )
  source = source.replace(
    `    csmInt16* dest = reinterpret_cast<csmInt16*>([_indices contents]);`,
    `    if (length == 0 || data == NULL)
    {
        return;
    }

    csmInt16* dest = reinterpret_cast<csmInt16*>([_indices contents]);`,
  )
  writeFileSync(path, source)
}

function patchMetalRenderer(sdkDir) {
  const path = join(sdkDir, 'Framework/src/Rendering/Metal/CubismRenderer_Metal.mm')
  if (!existsSync(path)) {
    return
  }

  let source = readFileSync(path, 'utf8')
  source = source.replace(
    `{
#ifndef CSM_DEBUG
    if (_textures[model.GetDrawableTextureIndex(index)] == 0)`,
    `{
    if (model.GetDrawableVertexCount(index) <= 0 || model.GetDrawableVertexIndexCount(index) <= 0)
    {
        return;
    }

#ifndef CSM_DEBUG
    if (_textures[model.GetDrawableTextureIndex(index)] == 0)`,
  )
  writeFileSync(path, source)
}

function patchMetalShaderLoader(sdkDir) {
  const path = join(sdkDir, 'Framework/src/Rendering/Metal/CubismShader_Metal.mm')
  if (!existsSync(path)) {
    return
  }

  let source = readFileSync(path, 'utf8')
  source = source.replace(
    `    // 頂点シェーダの取得/
    NSData *vertShaderData = [NSData dataWithContentsOfURL:vertShaderFileLibURL];
   if(vertShaderData == nil)
   {
       NSLog(@"ERROR: File load failed : %@", [vertShaderFileLibURL absoluteString]);
       return nil;
   }
   if([vertShaderData length] == 0)
   {
       NSLog(@"ERROR: File is loaded but file size is zero : %@", [vertShaderFileLibURL absoluteString]);
       return nil;
   }
    NSUInteger vertShaderByteLen = [vertShaderData length];
    Byte* vertShaderByteData = (Byte*)malloc(vertShaderByteLen);
    memcpy(vertShaderByteData, [vertShaderData bytes], vertShaderByteLen);
    dispatch_data_t vertShaderDispatchData = dispatch_data_create(vertShaderByteData, vertShaderByteLen, nil, DISPATCH_DATA_DESTRUCTOR_FREE);
    id<MTLLibrary> vertShaderLib = [device newLibraryWithData:vertShaderDispatchData error:nil];
    if(!vertShaderLib)
    {
        NSLog(@" ERROR: Couldnt create a vertex shader library");
        return nil;
    }

    // フラグメントシェーダの取得
   NSData *fragShaderData = [NSData dataWithContentsOfURL:fragShaderFileLibURL];
   if(fragShaderData == nil)
   {
       NSLog(@"ERROR: File load failed : %@", [fragShaderFileLibURL absoluteString]);
       return nil;
   }
   if([fragShaderData length] == 0)
   {
       NSLog(@"ERROR: File is loaded but file size is zero : %@", [fragShaderFileLibURL absoluteString]);
       return nil;
   }
    NSUInteger fragShaderByteLen = [fragShaderData length];
    Byte* fragShaderByteData = (Byte*)malloc(fragShaderByteLen);
    memcpy(fragShaderByteData, [fragShaderData bytes], fragShaderByteLen);
    dispatch_data_t fragShaderDispatchData = dispatch_data_create(fragShaderByteData, fragShaderByteLen, nil, DISPATCH_DATA_DESTRUCTOR_FREE);
    id<MTLLibrary> fragShaderLib = [device newLibraryWithData:fragShaderDispatchData error:nil];
    if(!fragShaderLib)
    {
        NSLog(@" ERROR: Couldnt create a frag shader library");
        return nil;
    }`,
    `    // 頂点シェーダの取得/
    if(vertShaderFileLibURL == nil)
    {
        NSLog(@"ERROR: File load failed : %@", vertShaderFileNameStr);
        return nil;
    }
    id<MTLLibrary> vertShaderLib = [device newLibraryWithURL:vertShaderFileLibURL error:nil];
    if(!vertShaderLib)
    {
        NSLog(@" ERROR: Couldnt create a vertex shader library: %@", [vertShaderFileLibURL absoluteString]);
        return nil;
    }

    // フラグメントシェーダの取得
    if(fragShaderFileLibURL == nil)
    {
        NSLog(@"ERROR: File load failed : %@", fragShaderFileNameStr);
        return nil;
    }
    id<MTLLibrary> fragShaderLib = [device newLibraryWithURL:fragShaderFileLibURL error:nil];
    if(!fragShaderLib)
    {
        NSLog(@" ERROR: Couldnt create a frag shader library: %@", [fragShaderFileLibURL absoluteString]);
        return nil;
    }`,
  )
  source = source.replace(
    `  ShaderProgram* shaderProgram = LoadShaderProgram(vertShaderSrc, fragShaderSrc, vertShaderLib, fragShaderLib);
  return shaderProgram;`,
    `  ShaderProgram* shaderProgram = LoadShaderProgram(vertShaderSrc, fragShaderSrc, vertShaderLib, fragShaderLib);
  [vertShaderLib release];
  [fragShaderLib release];
  return shaderProgram;`,
  )
  writeFileSync(path, source)
}

function patchMetalBlendShaderFallback(sdkDir) {
  const path = join(sdkDir, 'Framework/src/Rendering/Metal/CubismShader_Metal.mm')
  if (!existsSync(path)) {
    return
  }

  let source = readFileSync(path, 'utf8')
  source = source.replace(
    `void CubismShader_Metal::GenerateBlendShader(CubismShaderSet* shaderSet, const csmString& vertShaderFileName, const csmString& fragShaderFileName, const csmString& vertShaderSrc, const csmString& fragShaderSrc, id<MTLDevice> device)
{
    shaderSet->ShaderProgram = LoadShaderProgramFromFile(vertShaderFileName,
                                                         fragShaderFileName,
                                                         vertShaderFileName,
                                                         fragShaderSrc,
                                                         device);
    if (shaderSet->ShaderProgram == NULL)
    {
        return;
    }
    shaderSet->RenderPipelineState = MakeRenderPipelineState(device, shaderSet->ShaderProgram, 10);

    shaderSet->DepthStencilState = MakeDepthStencilState(device);
}`,
    `void CubismShader_Metal::GenerateBlendShader(CubismShaderSet* shaderSet, const csmString& vertShaderFileName, const csmString& fragShaderFileName, const csmString& vertShaderSrc, const csmString& fragShaderSrc, id<MTLDevice> device)
{
    CubismShaderSet* fallbackShaderSet = _shaderSets[ShaderNames_Normal];
    const csmBool masked = vertShaderFileName == csmString("VertShaderSrcMaskedBlend");
    const csmBool inverted = fragShaderSrc == csmString("FragShaderSrcMaskInvertedBlend") ||
                             fragShaderSrc == csmString("FragShaderSrcMaskInvertedPremultipliedAlphaBlend");
    const csmBool premultiplied = fragShaderSrc == csmString("FragShaderSrcPremultipliedAlphaBlend") ||
                                  fragShaderSrc == csmString("FragShaderSrcMaskPremultipliedAlphaBlend") ||
                                  fragShaderSrc == csmString("FragShaderSrcMaskInvertedPremultipliedAlphaBlend");

    if (masked && inverted && premultiplied)
    {
        fallbackShaderSet = _shaderSets[ShaderNames_NormalMaskedInvertedPremultipliedAlpha];
    }
    else if (masked && inverted)
    {
        fallbackShaderSet = _shaderSets[ShaderNames_NormalMaskedInverted];
    }
    else if (masked && premultiplied)
    {
        fallbackShaderSet = _shaderSets[ShaderNames_NormalMaskedPremultipliedAlpha];
    }
    else if (masked)
    {
        fallbackShaderSet = _shaderSets[ShaderNames_NormalMasked];
    }
    else if (premultiplied)
    {
        fallbackShaderSet = _shaderSets[ShaderNames_NormalPremultipliedAlpha];
    }

    shaderSet->ShaderProgram = fallbackShaderSet->ShaderProgram;
    shaderSet->RenderPipelineState = fallbackShaderSet->RenderPipelineState;
    shaderSet->DepthStencilState = fallbackShaderSet->DepthStencilState;
}`,
  )
  writeFileSync(path, source)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!existsSync(zipPath)) {
  fail(`Live2D SDK zip not found: ${zipPath}`)
}

rmSync(extractRoot, { force: true, recursive: true })
rmSync(iosDir, { force: true, recursive: true })
rmSync(androidDir, { force: true, recursive: true })
mkdirSync(extractRoot, { recursive: true })

const unzip = spawnSync('unzip', ['-q', zipPath, '-d', extractRoot], {
  encoding: 'utf8',
})

if (unzip.status !== 0) {
  fail(unzip.stderr || 'Unable to unzip Live2D SDK.')
}

if (!existsSync(sourceDir)) {
  fail(`Unexpected SDK folder layout. Missing: ${sourceDir}`)
}

mkdirSync(join(iosDir, 'Core'), { recursive: true })
mkdirSync(join(iosDir, 'Samples'), { recursive: true })
mkdirSync(join(androidDir, 'Core'), { recursive: true })
mkdirSync(join(androidDir, 'Samples'), { recursive: true })

cpSync(join(sourceDir, 'Core/include'), join(iosDir, 'Core/include'), { recursive: true })
cpSync(join(sourceDir, 'Core/lib/ios'), join(iosDir, 'Core/lib'), { recursive: true })
cpSync(join(sourceDir, 'Framework'), join(iosDir, 'Framework'), { recursive: true })
cpSync(join(sourceDir, 'Samples/Metal'), join(iosDir, 'Samples/Metal'), { recursive: true })
cpSync(join(sourceDir, 'LICENSE.md'), join(iosDir, 'LICENSE.md'))
cpSync(join(sourceDir, 'NOTICE.md'), join(iosDir, 'NOTICE.md'))
patchMetalCommandBuffer(iosDir)
patchMetalRenderer(iosDir)
patchMetalShaderLoader(iosDir)
patchMetalBlendShaderFallback(iosDir)

cpSync(join(sourceDir, 'Core/include'), join(androidDir, 'Core/include'), { recursive: true })
cpSync(join(sourceDir, 'Core/lib/android'), join(androidDir, 'Core/lib'), { recursive: true })
cpSync(join(sourceDir, 'Framework'), join(androidDir, 'Framework'), { recursive: true })
cpSync(join(sourceDir, 'Samples/OpenGL'), join(androidDir, 'Samples/OpenGL'), { recursive: true })
cpSync(join(sourceDir, 'LICENSE.md'), join(androidDir, 'LICENSE.md'))
cpSync(join(sourceDir, 'NOTICE.md'), join(androidDir, 'NOTICE.md'))

console.log(`Prepared local Live2D SDK from ${zipPath}`)
console.log('iOS SDK subset: vendor/live2d/ios')
console.log('Android SDK subset: vendor/live2d/android')
console.log('These folders are ignored by git.')
