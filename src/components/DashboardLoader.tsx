const DashboardSkeleton = () => {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-8 pt-20 space-y-8">
          <div className="space-y-8 animate-pulse">
            {/* Username placeholder */}
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 rounded" />
                <div className="h-4 w-48 bg-slate-200 rounded" />
              </div>
              <div className="h-12 w-12 bg-slate-200 rounded-full" />
            </div>
            
            {/* Stats cards placeholder */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border-l-4 border-l-purple-300 shadow-sm rounded-lg p-4">
                  <div className="pb-2 flex items-center gap-2">
                    <div className="h-4 w-4 bg-slate-200 rounded" />
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                  </div>
                  <div className="pt-2 space-y-2">
                    <div className="h-8 w-16 bg-slate-200 rounded" />
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Platform stats cards */}
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white/90 shadow-sm rounded-lg border border-purple-100">
                  <div className="border-b border-purple-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-slate-200 rounded" />
                        <div className="h-6 w-40 bg-slate-200 rounded" />
                      </div>
                      <div className="h-4 w-4 bg-slate-200 rounded" />
                    </div>
                    <div className="h-4 w-56 bg-slate-200 rounded" />
                  </div>
                  <div className="p-6">
                    {i === 0 ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div className="h-4 w-28 bg-slate-200 rounded" />
                          <div className="h-6 w-20 bg-slate-200 rounded" />
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5" />
                        <div className="grid grid-cols-3 gap-2">
                          {[...Array(3)].map((_, j) => (
                            <div key={j} className="p-3 bg-slate-50 rounded-lg">
                              <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
                              <div className="h-6 w-20 bg-slate-200 rounded mb-1" />
                              <div className="w-full bg-slate-100 rounded-full h-1.5" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                          <div className="h-10 w-20 bg-slate-200 rounded" />
                        </div>
                        <div className="h-4 w-48 bg-slate-200 rounded mb-6" />
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2" />
                        <div className="flex justify-between w-full">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className="h-3 w-8 bg-slate-200 rounded" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-purple-100 p-4 flex justify-end">
                    <div className="h-8 w-28 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Latest Contests card placeholder */}
            <div className="bg-white/90 shadow-sm rounded-lg border border-purple-100">
              <div className="border-b border-purple-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-slate-200 rounded" />
                      <div className="h-6 w-40 bg-slate-200 rounded" />
                    </div>
                    <div className="h-4 w-56 bg-slate-200 rounded" />
                  </div>
                  <div className="h-8 w-8 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="p-4 space-y-4">
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="rounded-lg border border-purple-100 overflow-hidden">
                    <div className="bg-slate-50 p-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-slate-200 rounded-full" />
                        <div className="space-y-1">
                          <div className="h-5 w-40 bg-slate-200 rounded" />
                          <div className="h-3 w-32 bg-slate-200 rounded" />
                        </div>
                      </div>
                      <div className="h-6 w-20 bg-slate-200 rounded-full" />
                    </div>
                    <div className="p-4 bg-white flex flex-wrap md:flex-nowrap justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-2 bg-slate-50 rounded-lg">
                          <div className="h-3 w-16 bg-slate-200 rounded mb-1" />
                          <div className="h-4 w-12 bg-slate-200 rounded" />
                        </div>
                        <div className="px-3 py-2 bg-slate-50 rounded-lg">
                          <div className="h-3 w-16 bg-slate-200 rounded mb-1" />
                          <div className="h-4 w-12 bg-slate-200 rounded" />
                        </div>
                      </div>
                      <div className="h-9 w-28 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Team Members card placeholder */}
            <div className="bg-white/90 shadow-sm rounded-lg border border-purple-100">
              <div className="border-b border-purple-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-slate-200 rounded" />
                      <div className="h-6 w-36 bg-slate-200 rounded" />
                    </div>
                    <div className="h-4 w-48 bg-slate-200 rounded" />
                  </div>
                  <div className="h-5 w-5 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="p-4">
                <div className="overflow-hidden rounded-lg border border-purple-100">
                  <div className="bg-slate-50 p-3 grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-5 w-full bg-slate-200 rounded" />
                    ))}
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-3 border-b border-slate-50 grid grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-slate-200 rounded-full" />
                        <div className="h-5 w-full bg-slate-200 rounded" />
                      </div>
                      <div className="h-5 w-full bg-slate-200 rounded" />
                      <div className="h-5 w-full bg-slate-200 rounded" />
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-4 w-8 bg-slate-200 rounded" />
                        <div className="w-16 bg-slate-100 rounded-full h-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-purple-100 p-4 flex justify-between">
                <div className="h-8 w-32 bg-slate-200 rounded" />
                <div className="h-8 w-32 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default DashboardSkeleton;