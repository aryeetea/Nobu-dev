#import "NobuLive2DBridge.h"
#import "Live2DCubismCore.h"

@implementation NobuLive2DBridge

+ (NSString *)coreVersionString
{
    csmVersion version = csmGetVersion();
    unsigned int major = (version >> 24) & 0xff;
    unsigned int minor = (version >> 16) & 0xff;
    unsigned int patch = version & 0xffff;

    return [NSString stringWithFormat:@"%u.%u.%u", major, minor, patch];
}

+ (nullable NSString *)bundledModelPathForCharacter:(NSString *)character
{
    NSString *directory = nil;
    NSString *fileName = nil;

    if ([character caseInsensitiveCompare:@"Alexia"] == NSOrderedSame ||
        [character caseInsensitiveCompare:@"female"] == NSOrderedSame)
    {
        directory = @"models/Alexia";
        fileName = @"Alexia.model3";
    }
    else if ([character caseInsensitiveCompare:@"Asuka"] == NSOrderedSame ||
             [character caseInsensitiveCompare:@"male"] == NSOrderedSame)
    {
        directory = @"models/ASUKA";
        fileName = @"Asuka.model3";
    }
    else
    {
        return nil;
    }

    return [[NSBundle mainBundle] pathForResource:fileName ofType:@"json" inDirectory:directory];
}

+ (BOOL)bundledMocIsReadableForCharacter:(NSString *)character errorMessage:(NSString * _Nullable * _Nullable)errorMessage
{
    NSString *directory = nil;
    NSString *fileName = nil;

    if ([character caseInsensitiveCompare:@"Alexia"] == NSOrderedSame ||
        [character caseInsensitiveCompare:@"female"] == NSOrderedSame)
    {
        directory = @"models/Alexia";
        fileName = @"Alexia";
    }
    else if ([character caseInsensitiveCompare:@"Asuka"] == NSOrderedSame ||
             [character caseInsensitiveCompare:@"male"] == NSOrderedSame)
    {
        directory = @"models/ASUKA";
        fileName = @"Asuka";
    }
    else
    {
        if (errorMessage != nil)
        {
            *errorMessage = [NSString stringWithFormat:@"Unknown character %@", character];
        }
        return NO;
    }

    NSString *mocPath = [[NSBundle mainBundle] pathForResource:fileName ofType:@"moc3" inDirectory:directory];
    if (mocPath.length == 0)
    {
        if (errorMessage != nil)
        {
            *errorMessage = [NSString stringWithFormat:@"%@.moc3 is missing from %@", fileName, directory];
        }
        return NO;
    }

    NSData *mocData = [NSData dataWithContentsOfFile:mocPath];
    if (mocData.length == 0)
    {
        if (errorMessage != nil)
        {
            *errorMessage = [NSString stringWithFormat:@"%@.moc3 could not be read", fileName];
        }
        return NO;
    }

    csmMocVersion mocVersion = csmGetMocVersion(mocData.bytes, (unsigned int)mocData.length);
    if (mocVersion == csmMocVersion_Unknown)
    {
        if (errorMessage != nil)
        {
            *errorMessage = [NSString stringWithFormat:@"%@.moc3 has an unknown Cubism moc version", fileName];
        }
        return NO;
    }

    return YES;
}

@end
