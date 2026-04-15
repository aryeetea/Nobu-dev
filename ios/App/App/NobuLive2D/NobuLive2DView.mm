#import "NobuLive2DView.h"

#import <Metal/Metal.h>
#import <MetalKit/MetalKit.h>
#import <QuartzCore/CAMetalLayer.h>
#import <string>

#import <CubismDefaultParameterId.hpp>
#import <CubismFramework.hpp>
#import <CubismModelSettingJson.hpp>
#import <Effect/CubismBreath.hpp>
#import <Effect/CubismEyeBlink.hpp>
#import <Id/CubismIdManager.hpp>
#import <Math/CubismMatrix44.hpp>
#import <Math/CubismModelMatrix.hpp>
#import <Motion/CubismExpressionMotion.hpp>
#import <Motion/CubismExpressionMotionManager.hpp>
#import <Motion/CubismMotion.hpp>
#import <Motion/CubismMotionManager.hpp>
#import <Model/CubismModel.hpp>
#import <Model/CubismUserModel.hpp>
#import <Physics/CubismPhysics.hpp>
#import <Rendering/Metal/CubismRenderer_Metal.hpp>
#import <Type/csmMap.hpp>
#import <Type/csmString.hpp>
#import <Type/csmVector.hpp>

#import "Live2DCubismCore.h"

using namespace Live2D::Cubism::Framework;
using namespace Live2D::Cubism::Framework::DefaultParameterId;

namespace {

class NobuCubismAllocator : public ICubismAllocator
{
public:
    void* Allocate(const csmSizeType size) override
    {
        return malloc(size);
    }

    void Deallocate(void* memory) override
    {
        free(memory);
    }

    void* AllocateAligned(const csmSizeType size, const csmUint32 alignment) override
    {
        void* aligned = NULL;
        if (posix_memalign(&aligned, alignment, size) != 0)
        {
            return NULL;
        }
        return aligned;
    }

    void DeallocateAligned(void* alignedMemory) override
    {
        free(alignedMemory);
    }
};

static NobuCubismAllocator g_allocator;
static bool g_frameworkReady = false;

void EnsureCubismFramework()
{
    if (g_frameworkReady)
    {
        return;
    }

    CubismFramework::Option option;
    option.LogFunction = NULL;
    option.LoggingLevel = CubismFramework::Option::LogLevel_Warning;

    CubismFramework::StartUp(&g_allocator, &option);
    CubismFramework::Initialize();
    g_frameworkReady = true;
}

NSData* ReadFile(NSString* path)
{
    if (path.length == 0)
    {
        return nil;
    }

    return [NSData dataWithContentsOfFile:path];
}

NSString* CharacterDirectory(NSString* character)
{
    if ([character caseInsensitiveCompare:@"Asuka"] == NSOrderedSame ||
        [character caseInsensitiveCompare:@"male"] == NSOrderedSame)
    {
        return @"models/ASUKA";
    }

    return @"models/Alexia";
}

NSString* CharacterModelFile(NSString* character)
{
    if ([character caseInsensitiveCompare:@"Asuka"] == NSOrderedSame ||
        [character caseInsensitiveCompare:@"male"] == NSOrderedSame)
    {
        return @"Asuka.model3.json";
    }

    return @"Alexia.model3.json";
}

NSString* BundlePath(NSString* directory, const csmChar* relativePath)
{
    NSString* relative = [NSString stringWithUTF8String:relativePath ?: ""];
    return [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:[directory stringByAppendingPathComponent:relative]];
}

class NobuNativeModel : public CubismUserModel
{
public:
    NobuNativeModel(id<MTLDevice> device)
    : _device(device)
    , _modelSetting(NULL)
    , _userTimeSeconds(0.0f)
    , _motionUpdated(false)
    , _opacity(1.0f)
    {
        _textureLoader = [[MTKTextureLoader alloc] initWithDevice:device];
        _idParamAngleX = CubismFramework::GetIdManager()->GetId(ParamAngleX);
        _idParamAngleY = CubismFramework::GetIdManager()->GetId(ParamAngleY);
        _idParamAngleZ = CubismFramework::GetIdManager()->GetId(ParamAngleZ);
        _idParamBodyAngleX = CubismFramework::GetIdManager()->GetId(ParamBodyAngleX);
        _idParamBreath = CubismFramework::GetIdManager()->GetId(ParamBreath);
    }

    ~NobuNativeModel() override
    {
        ReleaseMotions();
        ReleaseExpressions();
        delete _modelSetting;
        _modelSetting = NULL;
    }

    bool Load(NSString* character, CGSize drawableSize)
    {
        NSString* directory = CharacterDirectory(character);
        NSString* modelFile = CharacterModelFile(character);
        NSString* modelPath = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:[directory stringByAppendingPathComponent:modelFile]];
        NSData* modelData = ReadFile(modelPath);
        if (modelData.length == 0)
        {
            NSLog(@"Nobu Live2D model3 missing at %@", modelPath);
            return false;
        }

        _modelHomeDir = [directory stringByAppendingString:@"/"].UTF8String;
        _modelSetting = new CubismModelSettingJson((const csmByte*)modelData.bytes, static_cast<csmSizeInt>(modelData.length));

        if (!LoadMoc())
        {
            return false;
        }

        LoadExpressions();
        LoadPhysics();
        LoadEyeBlink();
        LoadBreath();
        LoadMotions();
        SetupLayout();
        CreateRenderer((csmUint32)MAX(drawableSize.width, 1), (csmUint32)MAX(drawableSize.height, 1));
        BindTextures();
        return GetModel() != NULL;
    }

    void Resize(CGSize drawableSize)
    {
        SetRenderTargetSize((csmUint32)MAX(drawableSize.width, 1), (csmUint32)MAX(drawableSize.height, 1));
    }

    void Update()
    {
        if (GetModel() == NULL)
        {
            return;
        }

        const csmFloat32 deltaTimeSeconds = 1.0f / 30.0f;
        _userTimeSeconds += deltaTimeSeconds;
        _motionUpdated = false;

        GetModel()->LoadParameters();
        if (_motionManager != NULL && !_motionManager->IsFinished())
        {
            _motionUpdated = _motionManager->UpdateMotion(GetModel(), deltaTimeSeconds);
        }
        GetModel()->SaveParameters();

        if (_eyeBlink != NULL && !_motionUpdated)
        {
            _eyeBlink->UpdateParameters(GetModel(), deltaTimeSeconds);
        }

        if (_expressionManager != NULL)
        {
            _expressionManager->UpdateMotion(GetModel(), deltaTimeSeconds);
        }

        if (_breath != NULL)
        {
            _breath->UpdateParameters(GetModel(), deltaTimeSeconds);
        }

        if (_physics != NULL)
        {
            _physics->Evaluate(GetModel(), deltaTimeSeconds);
        }

        _opacity = GetModel()->GetModelOpacity();
        GetModel()->Update();
    }

    void Draw(CubismMatrix44& matrix, id<MTLCommandBuffer> commandBuffer, MTLRenderPassDescriptor* passDescriptor, MTLViewport viewport)
    {
        if (GetModel() == NULL)
        {
            return;
        }

        Rendering::CubismRenderer_Metal* renderer = GetRenderer<Rendering::CubismRenderer_Metal>();
        if (renderer == NULL)
        {
            return;
        }

        renderer->StartFrame(commandBuffer, passDescriptor);
        renderer->SetRenderViewport(viewport);

        matrix.MultiplyByMatrix(_modelMatrix);
        renderer->SetMvpMatrix(&matrix);
        renderer->DrawModel();
    }

    void SetExpressionByName(NSString* expressionName)
    {
        if (expressionName.length == 0)
        {
            return;
        }

        csmString key = expressionName.UTF8String;
        ACubismMotion* expression = _expressions[key];
        if (expression != NULL)
        {
            _expressionManager->StartMotion(expression, false);
        }
    }

    void StartMotionGroup(NSString* groupName, NSInteger index)
    {
        if (groupName.length == 0 || index < 0)
        {
            return;
        }

        csmString key = csmString(groupName.UTF8String) + "_" + csmString(std::to_string(index).c_str());
        CubismMotion* motion = static_cast<CubismMotion*>(_motions[key]);
        if (motion != NULL)
        {
            motion->SetEffectIds(_eyeBlinkIds, _lipSyncIds);
            _motionManager->StartMotionPriority(motion, false, 3);
        }
    }

private:
    bool LoadMoc()
    {
        if (_modelSetting == NULL || strcmp(_modelSetting->GetModelFileName(), "") == 0)
        {
            return false;
        }

        NSString* path = BundlePath([NSString stringWithUTF8String:_modelHomeDir.GetRawString()], _modelSetting->GetModelFileName());
        NSData* data = ReadFile(path);
        if (data.length == 0)
        {
            NSLog(@"Nobu Live2D moc missing at %@", path);
            return false;
        }

        LoadModel((const csmByte*)data.bytes, static_cast<csmSizeInt>(data.length), true);
        return GetModel() != NULL;
    }

    void LoadExpressions()
    {
        if (_modelSetting == NULL)
        {
            return;
        }

        for (csmInt32 i = 0; i < _modelSetting->GetExpressionCount(); i++)
        {
            csmString name = _modelSetting->GetExpressionName(i);
            NSString* path = BundlePath([NSString stringWithUTF8String:_modelHomeDir.GetRawString()], _modelSetting->GetExpressionFileName(i));
            NSData* data = ReadFile(path);
            if (data.length == 0)
            {
                continue;
            }

            ACubismMotion* expression = LoadExpression((const csmByte*)data.bytes, static_cast<csmSizeInt>(data.length), name.GetRawString());
            if (expression != NULL)
            {
                _expressions[name] = expression;
            }
        }
    }

    void LoadPhysics()
    {
        if (_modelSetting == NULL || strcmp(_modelSetting->GetPhysicsFileName(), "") == 0)
        {
            return;
        }

        NSString* path = BundlePath([NSString stringWithUTF8String:_modelHomeDir.GetRawString()], _modelSetting->GetPhysicsFileName());
        NSData* data = ReadFile(path);
        if (data.length > 0)
        {
            CubismUserModel::LoadPhysics((const csmByte*)data.bytes, static_cast<csmSizeInt>(data.length));
        }
    }

    void LoadEyeBlink()
    {
        if (_modelSetting == NULL || _modelSetting->GetEyeBlinkParameterCount() <= 0)
        {
            return;
        }

        _eyeBlink = CubismEyeBlink::Create(_modelSetting);
        for (csmInt32 i = 0; i < _modelSetting->GetEyeBlinkParameterCount(); ++i)
        {
            _eyeBlinkIds.PushBack(_modelSetting->GetEyeBlinkParameterId(i));
        }
    }

    void LoadBreath()
    {
        _breath = CubismBreath::Create();
        csmVector<CubismBreath::BreathParameterData> breathParameters;
        breathParameters.PushBack(CubismBreath::BreathParameterData(_idParamAngleX, 0.0f, 12.0f, 6.0f, 0.45f));
        breathParameters.PushBack(CubismBreath::BreathParameterData(_idParamAngleY, 0.0f, 8.0f, 3.5f, 0.45f));
        breathParameters.PushBack(CubismBreath::BreathParameterData(_idParamAngleZ, 0.0f, 8.0f, 5.5f, 0.45f));
        breathParameters.PushBack(CubismBreath::BreathParameterData(_idParamBodyAngleX, 0.0f, 3.0f, 15.0f, 0.45f));
        breathParameters.PushBack(CubismBreath::BreathParameterData(_idParamBreath, 0.5f, 0.5f, 3.0f, 0.45f));
        _breath->SetParameters(breathParameters);
    }

    void LoadMotions()
    {
        if (_modelSetting == NULL)
        {
            return;
        }

        for (csmInt32 groupIndex = 0; groupIndex < _modelSetting->GetMotionGroupCount(); groupIndex++)
        {
            const csmChar* group = _modelSetting->GetMotionGroupName(groupIndex);
            const csmInt32 count = _modelSetting->GetMotionCount(group);
            for (csmInt32 motionIndex = 0; motionIndex < count; motionIndex++)
            {
                NSString* path = BundlePath([NSString stringWithUTF8String:_modelHomeDir.GetRawString()], _modelSetting->GetMotionFileName(group, motionIndex));
                NSData* data = ReadFile(path);
                if (data.length == 0)
                {
                    continue;
                }

                csmString key = csmString(group) + "_" + csmString(std::to_string(motionIndex).c_str());
                CubismMotion* motion = static_cast<CubismMotion*>(LoadMotion((const csmByte*)data.bytes, static_cast<csmSizeInt>(data.length), key.GetRawString(), NULL, NULL, _modelSetting, group, motionIndex));
                if (motion != NULL)
                {
                    motion->SetEffectIds(_eyeBlinkIds, _lipSyncIds);
                    _motions[key] = motion;
                }
            }
        }
    }

    void SetupLayout()
    {
        if (_modelSetting == NULL || _modelMatrix == NULL)
        {
            return;
        }

        csmMap<csmString, csmFloat32> layout;
        _modelSetting->GetLayoutMap(layout);
        _modelMatrix->SetupFromLayout(layout);
        _modelMatrix->Scale(1.18f, 1.18f);
        _modelMatrix->TranslateY(-0.08f);
        GetModel()->SaveParameters();
    }

    void BindTextures()
    {
        if (_modelSetting == NULL)
        {
            return;
        }

        Rendering::CubismRenderer_Metal* renderer = GetRenderer<Rendering::CubismRenderer_Metal>();
        if (renderer == NULL)
        {
            return;
        }

        NSDictionary* options = @{
            MTKTextureLoaderOptionSRGB: @NO,
            MTKTextureLoaderOptionOrigin: MTKTextureLoaderOriginTopLeft
        };

        for (csmInt32 textureIndex = 0; textureIndex < _modelSetting->GetTextureCount(); textureIndex++)
        {
            const csmChar* textureFileName = _modelSetting->GetTextureFileName(textureIndex);
            if (strcmp(textureFileName, "") == 0)
            {
                continue;
            }

            NSString* path = BundlePath([NSString stringWithUTF8String:_modelHomeDir.GetRawString()], textureFileName);
            NSURL* url = [NSURL fileURLWithPath:path];
            NSError* error = nil;
            id<MTLTexture> texture = [_textureLoader newTextureWithContentsOfURL:url options:options error:&error];
            if (texture == nil)
            {
                NSLog(@"Nobu Live2D texture failed at %@: %@", path, error.localizedDescription);
                continue;
            }

            renderer->BindTexture(textureIndex, texture);
        }

        renderer->IsPremultipliedAlpha(false);
    }

    void ReleaseMotions()
    {
        for (csmMap<csmString, ACubismMotion*>::const_iterator iterator = _motions.Begin(); iterator != _motions.End(); ++iterator)
        {
            ACubismMotion::Delete(iterator->Second);
        }
        _motions.Clear();
    }

    void ReleaseExpressions()
    {
        for (csmMap<csmString, ACubismMotion*>::const_iterator iterator = _expressions.Begin(); iterator != _expressions.End(); ++iterator)
        {
            ACubismMotion::Delete(iterator->Second);
        }
        _expressions.Clear();
    }

    id<MTLDevice> _device;
    MTKTextureLoader* _textureLoader;
    ICubismModelSetting* _modelSetting;
    csmString _modelHomeDir;
    csmFloat32 _userTimeSeconds;
    csmBool _motionUpdated;
    csmFloat32 _opacity;
    csmMap<csmString, ACubismMotion*> _expressions;
    csmMap<csmString, ACubismMotion*> _motions;
    csmVector<CubismIdHandle> _eyeBlinkIds;
    csmVector<CubismIdHandle> _lipSyncIds;
    const CubismId* _idParamAngleX;
    const CubismId* _idParamAngleY;
    const CubismId* _idParamAngleZ;
    const CubismId* _idParamBodyAngleX;
    const CubismId* _idParamBreath;
};

} // namespace

@interface NobuLive2DView ()
@property (nonatomic, strong) id<MTLDevice> device;
@property (nonatomic, strong) id<MTLCommandQueue> commandQueue;
@property (nonatomic, strong) id<MTLTexture> depthTexture;
@property (nonatomic, strong) CADisplayLink *displayLink;
@property (nonatomic, copy) NSString *character;
@end

@implementation NobuLive2DView
{
    NobuNativeModel* _model;
}

+ (Class)layerClass
{
    return [CAMetalLayer class];
}

- (instancetype)initWithCharacter:(NSString *)character
{
    self = [super initWithFrame:CGRectZero];
    if (self)
    {
        _character = [character copy];
        [self configureMetal];
    }
    return self;
}

- (void)dealloc
{
    [_displayLink invalidate];
    delete _model;
    _model = NULL;
}

- (void)didMoveToWindow
{
    [super didMoveToWindow];

    if (self.window == nil)
    {
        [_displayLink invalidate];
        _displayLink = nil;
        return;
    }

    [self ensureModelLoaded];
    [self startDisplayLink];
}

- (void)layoutSubviews
{
    [super layoutSubviews];
    CAMetalLayer* metalLayer = (CAMetalLayer*)self.layer;
    CGFloat scale = self.window.screen.nativeScale ?: UIScreen.mainScreen.nativeScale;
    CGSize drawableSize = CGSizeMake(MAX(self.bounds.size.width * scale, 1), MAX(self.bounds.size.height * scale, 1));
    metalLayer.drawableSize = drawableSize;
    [self resizeDepthTexture:drawableSize];

    if (_model != NULL)
    {
        _model->Resize(drawableSize);
    }
}

- (void)resizeDepthTexture:(CGSize)drawableSize
{
    if (_device == nil || drawableSize.width <= 0 || drawableSize.height <= 0)
    {
        self.depthTexture = nil;
        return;
    }

    if (_depthTexture != nil &&
        _depthTexture.width == (NSUInteger)drawableSize.width &&
        _depthTexture.height == (NSUInteger)drawableSize.height)
    {
        return;
    }

    MTLTextureDescriptor* descriptor = [MTLTextureDescriptor texture2DDescriptorWithPixelFormat:MTLPixelFormatDepth32Float
                                                                                           width:(NSUInteger)drawableSize.width
                                                                                          height:(NSUInteger)drawableSize.height
                                                                                       mipmapped:NO];
    descriptor.usage = MTLTextureUsageRenderTarget;
    descriptor.storageMode = MTLStorageModePrivate;
    self.depthTexture = [_device newTextureWithDescriptor:descriptor];
}

- (void)setCharacter:(NSString *)character
{
    if ([_character isEqualToString:character])
    {
        return;
    }

    _character = [character copy];
    delete _model;
    _model = NULL;
    [self ensureModelLoaded];
}

- (void)playExpression:(NSString *)expressionName
{
    if (_model != NULL)
    {
        _model->SetExpressionByName(expressionName);
    }
}

- (void)playMotionGroup:(NSString *)group index:(NSInteger)index
{
    if (_model != NULL)
    {
        _model->StartMotionGroup(group, index);
    }
}

- (void)configureMetal
{
    self.backgroundColor = UIColor.clearColor;
    self.opaque = NO;
    self.userInteractionEnabled = NO;

    _device = MTLCreateSystemDefaultDevice();
    _commandQueue = [_device newCommandQueue];

    CAMetalLayer* metalLayer = (CAMetalLayer*)self.layer;
    metalLayer.device = _device;
    metalLayer.pixelFormat = MTLPixelFormatBGRA8Unorm;
    metalLayer.framebufferOnly = YES;
    metalLayer.opaque = NO;
    metalLayer.backgroundColor = UIColor.clearColor.CGColor;
    metalLayer.contentsScale = UIScreen.mainScreen.nativeScale;

    EnsureCubismFramework();
    Rendering::CubismRenderer_Metal::SetConstantSettings(_device);
}

- (void)ensureModelLoaded
{
    if (_model != NULL || _device == nil || self.bounds.size.width <= 0 || self.bounds.size.height <= 0)
    {
        return;
    }

    CAMetalLayer* metalLayer = (CAMetalLayer*)self.layer;
    if (metalLayer.drawableSize.width <= 0 || metalLayer.drawableSize.height <= 0)
    {
        [self setNeedsLayout];
        [self layoutIfNeeded];
    }

    _model = new NobuNativeModel(_device);
    if (!_model->Load(_character ?: @"Alexia", metalLayer.drawableSize))
    {
        delete _model;
        _model = NULL;
    }
}

- (void)startDisplayLink
{
    if (_displayLink != nil)
    {
        return;
    }

    _displayLink = [self.window.screen displayLinkWithTarget:self selector:@selector(renderFrame)];
    _displayLink.preferredFramesPerSecond = 30;
    [_displayLink addToRunLoop:NSRunLoop.mainRunLoop forMode:NSRunLoopCommonModes];
}

- (void)renderFrame
{
    [self ensureModelLoaded];
    if (_model == NULL || _commandQueue == nil)
    {
        return;
    }

    CAMetalLayer* metalLayer = (CAMetalLayer*)self.layer;
    id<CAMetalDrawable> drawable = [metalLayer nextDrawable];
    if (drawable == nil)
    {
        return;
    }

    id<MTLCommandBuffer> commandBuffer = [_commandQueue commandBuffer];
    if (commandBuffer == nil)
    {
        return;
    }

    if (_depthTexture == nil ||
        _depthTexture.width != (NSUInteger)metalLayer.drawableSize.width ||
        _depthTexture.height != (NSUInteger)metalLayer.drawableSize.height)
    {
        [self resizeDepthTexture:metalLayer.drawableSize];
    }

    MTLRenderPassDescriptor* passDescriptor = [MTLRenderPassDescriptor renderPassDescriptor];
    passDescriptor.colorAttachments[0].texture = drawable.texture;
    passDescriptor.colorAttachments[0].loadAction = MTLLoadActionClear;
    passDescriptor.colorAttachments[0].storeAction = MTLStoreActionStore;
    passDescriptor.colorAttachments[0].clearColor = MTLClearColorMake(0, 0, 0, 0);
    passDescriptor.depthAttachment.texture = _depthTexture;
    passDescriptor.depthAttachment.loadAction = MTLLoadActionClear;
    passDescriptor.depthAttachment.storeAction = MTLStoreActionDontCare;
    passDescriptor.depthAttachment.clearDepth = 1.0;

    _model->Update();

    CGFloat width = MAX(self.bounds.size.width, 1);
    CGFloat height = MAX(self.bounds.size.height, 1);
    CGFloat ratio = width / height;

    CubismMatrix44 projection;
    if (width < height)
    {
        projection.Scale(1.0f, (csmFloat32)ratio);
    }
    else
    {
        projection.Scale((csmFloat32)(height / width), 1.0f);
    }

    MTLViewport viewport = {0, 0, (double)metalLayer.drawableSize.width, (double)metalLayer.drawableSize.height, 0.0, 1.0};
    _model->Draw(projection, commandBuffer, passDescriptor, viewport);

    [commandBuffer presentDrawable:drawable];
    [commandBuffer commit];
}

@end
