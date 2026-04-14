#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface NobuLive2DBridge : NSObject

+ (NSString *)coreVersionString;
+ (nullable NSString *)bundledModelPathForCharacter:(NSString *)character;
+ (BOOL)bundledMocIsReadableForCharacter:(NSString *)character errorMessage:(NSString * _Nullable * _Nullable)errorMessage;

@end

NS_ASSUME_NONNULL_END
